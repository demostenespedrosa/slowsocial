package connections

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ConnectionItem struct {
	ID             string    `json:"id"`
	ConnectedUserID string   `json:"connected_user_id"`
	FullName       string    `json:"full_name"`
	Username       string    `json:"username"`
	AvatarURL      string    `json:"avatar_url"`
	Headline       string    `json:"headline"`
	DegreeLevel    int       `json:"degree_level"`
	Status         string    `json:"status"` // 'pending', 'active', 'blocked'
	IsRequester    bool      `json:"is_requester"`
	CreatedAt      time.Time `json:"created_at"`
}

type ConnectionService struct {
	pool *pgxpool.Pool
}

func NewConnectionService(pool *pgxpool.Pool) *ConnectionService {
	return &ConnectionService{pool: pool}
}

// ListConnections lista conexões ativas ou solicitações pendentes do usuário
func (s *ConnectionService) ListConnections(ctx context.Context, userID, status string) ([]ConnectionItem, error) {
	if status == "" {
		status = "active"
	}

	query := `
		SELECT 
			c.id,
			CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END AS connected_user_id,
			COALESCE(u.full_name, '') as full_name,
			COALESCE(u.username, '') as username,
			COALESCE(u.avatar_url, '') as avatar_url,
			COALESCE(u.headline, '') as headline,
			c.degree_level,
			c.status,
			(c.user_a_id = $1) as is_requester,
			c.created_at
		FROM connections c
		JOIN users u ON u.id = (CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END)
		WHERE (c.user_a_id = $1 OR c.user_b_id = $1)
		  AND c.status = $2
		ORDER BY c.created_at DESC;
	`

	rows, err := s.pool.Query(ctx, query, userID, status)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar conexões: %w", err)
	}
	defer rows.Close()

	var list []ConnectionItem
	for rows.Next() {
		var item ConnectionItem
		err := rows.Scan(
			&item.ID,
			&item.ConnectedUserID,
			&item.FullName,
			&item.Username,
			&item.AvatarURL,
			&item.Headline,
			&item.DegreeLevel,
			&item.Status,
			&item.IsRequester,
			&item.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao ler conexão: %w", err)
		}
		list = append(list, item)
	}

	if list == nil {
		list = []ConnectionItem{}
	}
	return list, nil
}

// RequestConnection cria uma solicitação de conexão reflexiva (status: pending)
func (s *ConnectionService) RequestConnection(ctx context.Context, requesterID, targetUserID, note string) (*ConnectionItem, error) {
	if requesterID == targetUserID {
		return nil, errors.New("não é possível se conectar a si mesmo")
	}

	if len(note) > 140 {
		return nil, errors.New("a nota reflexiva deve ter no máximo 140 caracteres")
	}

	connID := uuid.New().String()

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Inserir ou atualizar na tabela de conexões
	insertConnQuery := `
		INSERT INTO connections (id, user_a_id, user_b_id, degree_level, status, created_at)
		VALUES ($1, $2, $3, 1, 'pending', NOW())
		ON CONFLICT (user_a_id, user_b_id) 
		DO UPDATE SET status = 'pending', created_at = NOW()
		RETURNING created_at;
	`
	var createdAt time.Time
	err = tx.QueryRow(ctx, insertConnQuery, connID, requesterID, targetUserID).Scan(&createdAt)
	if err != nil {
		return nil, fmt.Errorf("erro ao registrar conexão: %w", err)
	}

	// 2. Se houver nota, cria conversa na aba 'request'
	if note != "" {
		convQuery := `
			INSERT INTO conversations (id, tab, participant_a_id, participant_b_id, subject, status, last_message_preview, last_message_at, created_at)
			VALUES ($1, 'request', $2, $3, $4, 'pending_request', $4, NOW(), NOW())
			ON CONFLICT (participant_a_id, participant_b_id)
			DO UPDATE SET subject = EXCLUDED.subject, status = 'pending_request', last_message_at = NOW();
		`
		_, _ = tx.Exec(ctx, convQuery, uuid.New().String(), requesterID, targetUserID, note)
	}

	// 3. Notificar o destinatário
	notifQuery := `
		INSERT INTO notifications (id, recipient_id, actor_id, type, title, detail, reference_id, is_read, created_at)
		VALUES ($1, $2, $3, 'connection_request', 'Nova solicitação de conexão', $4, $5, false, NOW());
	`
	_, _ = tx.Exec(ctx, notifQuery, uuid.New().String(), targetUserID, requesterID, note, connID)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	// Buscar dados do destinatário
	var targetName, targetUsername, targetAvatar, targetHeadline string
	_ = s.pool.QueryRow(ctx, "SELECT full_name, username, COALESCE(avatar_url, ''), COALESCE(headline, '') FROM users WHERE id = $1", targetUserID).
		Scan(&targetName, &targetUsername, &targetAvatar, &targetHeadline)

	return &ConnectionItem{
		ID:              connID,
		ConnectedUserID: targetUserID,
		FullName:        targetName,
		Username:        targetUsername,
		AvatarURL:       targetAvatar,
		Headline:        targetHeadline,
		DegreeLevel:     1,
		Status:          "pending",
		IsRequester:     true,
		CreatedAt:       createdAt,
	}, nil
}

// AcceptConnection aceita a solicitação e torna a conexão 'active'
func (s *ConnectionService) AcceptConnection(ctx context.Context, connectionID, currentUserID string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// O usuário atual deve ser o user_b_id (destinatário da solicitação)
	query := `
		UPDATE connections 
		SET status = 'active'
		WHERE id = $1 AND user_b_id = $2 AND status = 'pending'
		RETURNING user_a_id;
	`
	var requesterID string
	err = tx.QueryRow(ctx, query, connectionID, currentUserID).Scan(&requesterID)
	if err != nil {
		return fmt.Errorf("solicitação não encontrada ou já processada: %w", err)
	}

	// Atualizar conversa se existir para 'direct' e 'active'
	updateConvQuery := `
		UPDATE conversations 
		SET tab = 'direct', status = 'active' 
		WHERE (participant_a_id = $1 AND participant_b_id = $2)
		   OR (participant_a_id = $2 AND participant_b_id = $1);
	`
	_, _ = tx.Exec(ctx, updateConvQuery, requesterID, currentUserID)

	// Notificar o solicitante sobre a aceitação
	notifQuery := `
		INSERT INTO notifications (id, recipient_id, actor_id, type, title, detail, reference_id, is_read, created_at)
		VALUES ($1, $2, $3, 'connection_accepted', 'Sua solicitação de conexão foi aceita', 'Agora vocês estão conectados diretamente.', $4, false, NOW());
	`
	_, _ = tx.Exec(ctx, notifQuery, uuid.New().String(), requesterID, currentUserID, connectionID)

	return tx.Commit(ctx)
}

// RejectConnection remove a solicitação pendente
func (s *ConnectionService) RejectConnection(ctx context.Context, connectionID, currentUserID string) error {
	query := `
		DELETE FROM connections 
		WHERE id = $1 AND user_b_id = $2 AND status = 'pending';
	`
	tag, err := s.pool.Exec(ctx, query, connectionID, currentUserID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("solicitação não encontrada")
	}
	return nil
}

// RemoveConnection desfaz uma conexão ativa existente
func (s *ConnectionService) RemoveConnection(ctx context.Context, connectionID, currentUserID string) error {
	query := `
		DELETE FROM connections 
		WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2);
	`
	tag, err := s.pool.Exec(ctx, query, connectionID, currentUserID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("conexão não encontrada")
	}
	return nil
}
