package notifications

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Notification struct {
	ID            string    `json:"id"`
	RecipientID   string    `json:"recipient_id"`
	ActorID       string    `json:"actor_id"`
	ActorName     string    `json:"actor_name"`
	ActorUsername string    `json:"actor_username"`
	ActorAvatar   string    `json:"actor_avatar"`
	Type          string    `json:"type"`
	Title         string    `json:"title"`
	Detail        string    `json:"detail"`
	ReferenceID   *string   `json:"reference_id,omitempty"`
	IsRead        bool      `json:"is_read"`
	CreatedAt     time.Time `json:"created_at"`
}

type NotificationService struct {
	pool *pgxpool.Pool
}

func NewNotificationService(pool *pgxpool.Pool) *NotificationService {
	return &NotificationService{pool: pool}
}

// GetUserNotifications retorna a lista cronológica de alertas do usuário com JOIN no ator
func (s *NotificationService) GetUserNotifications(ctx context.Context, userID string, limit, offset int) ([]Notification, error) {
	if limit <= 0 {
		limit = 20
	}

	query := `
		SELECT 
			n.id, n.recipient_id, n.actor_id,
			COALESCE(u.full_name, 'Alguém') as actor_name,
			COALESCE(u.username, '') as actor_username,
			COALESCE(u.avatar_url, '') as actor_avatar,
			n.type, n.title, COALESCE(n.detail, ''),
			n.reference_id, n.is_read, n.created_at
		FROM notifications n
		LEFT JOIN users u ON u.id = n.actor_id
		WHERE n.recipient_id = $1
		ORDER BY n.created_at DESC
		LIMIT $2 OFFSET $3;
	`

	rows, err := s.pool.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar notificações: %w", err)
	}
	defer rows.Close()

	var result []Notification
	for rows.Next() {
		var n Notification
		var refID *string
		err := rows.Scan(
			&n.ID, &n.RecipientID, &n.ActorID,
			&n.ActorName, &n.ActorUsername, &n.ActorAvatar,
			&n.Type, &n.Title, &n.Detail,
			&refID, &n.IsRead, &n.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear notificação: %w", err)
		}
		n.ReferenceID = refID
		result = append(result, n)
	}

	if result == nil {
		result = []Notification{}
	}
	return result, nil
}

// GetUnreadCount retorna a contagem de alertas não lidos para badges
func (s *NotificationService) GetUnreadCount(ctx context.Context, userID string) (int, error) {
	query := `SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = false;`
	var count int
	err := s.pool.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}

// MarkAsRead marca uma notificação específica como lida
func (s *NotificationService) MarkAsRead(ctx context.Context, notifID, userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2;`
	_, err := s.pool.Exec(ctx, query, notifID, userID)
	return err
}

// MarkAllAsRead marca todas as notificações do usuário como lidas
func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE recipient_id = $1 AND is_read = false;`
	_, err := s.pool.Exec(ctx, query, userID)
	return err
}
