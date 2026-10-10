package momentos

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MomentoItem struct {
	ID             string    `json:"id"`
	MediaURL       string    `json:"media_url,omitempty"`
	TextNote       string    `json:"text_note,omitempty"`
	ExpiresInHours int       `json:"expires_in_hours"`
	HasViewed      bool      `json:"has_viewed"`
	CreatedAt      time.Time `json:"created_at"`
}

type AuthorMomentosGroup struct {
	AuthorID       string        `json:"author_id"`
	AuthorName     string        `json:"author_name"`
	AuthorUsername string        `json:"author_username"`
	AuthorAvatar   string        `json:"author_avatar"`
	HasUnviewed    bool          `json:"has_unviewed"`
	Stories        []MomentoItem `json:"stories"`
}

type MomentoService struct {
	db *pgxpool.Pool
}

func NewMomentoService(db *pgxpool.Pool) *MomentoService {
	return &MomentoService{db: db}
}

// CreateMomento publica um novo momento com expiração de 24h
func (s *MomentoService) CreateMomento(ctx context.Context, authorID, mediaURL, textNote string, expiresInHours int) (string, error) {
	if mediaURL == "" && textNote == "" {
		return "", fmt.Errorf("o momento deve conter mídia ou texto")
	}

	if expiresInHours <= 0 {
		expiresInHours = 24
	}

	momentoID := uuid.New().String()
	expiresAt := time.Now().Add(time.Duration(expiresInHours) * time.Hour)

	query := `
		INSERT INTO momentos (id, author_id, media_url, text_note, expires_at)
		VALUES ($1, $2, $3, $4, $5);
	`

	_, err := s.db.Exec(ctx, query, momentoID, authorID, mediaURL, textNote, expiresAt)
	if err != nil {
		return "", fmt.Errorf("falha ao criar momento: %w", err)
	}

	return momentoID, nil
}

// GetActiveMomentosGrouped busca todos os momentos ativos agrupados por autor
func (s *MomentoService) GetActiveMomentosGrouped(ctx context.Context, viewerID string) ([]AuthorMomentosGroup, error) {
	query := `
		SELECT 
			m.id, m.author_id, u.full_name, u.username, COALESCE(u.avatar_url, ''),
			COALESCE(m.media_url, ''), COALESCE(m.text_note, ''),
			GREATEST(1, EXTRACT(EPOCH FROM (m.expires_at - NOW())) / 3600)::INT as expires_in_hours,
			(mv.viewer_id IS NOT NULL) as has_viewed,
			m.created_at
		FROM momentos m
		JOIN users u ON u.id = m.author_id
		LEFT JOIN momento_views mv ON (mv.momento_id = m.id AND mv.viewer_id = $1)
		WHERE m.expires_at > NOW()
		ORDER BY m.created_at ASC;
	`

	rows, err := s.db.Query(ctx, query, viewerID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar momentos: %w", err)
	}
	defer rows.Close()

	groupMap := make(map[string]*AuthorMomentosGroup)
	var order []string

	for rows.Next() {
		var (
			momentoID      string
			authorID       string
			authorName     string
			authorUsername string
			authorAvatar   string
			mediaURL       string
			textNote       string
			expiresInHours int
			hasViewed      bool
			createdAt      time.Time
		)

		err := rows.Scan(
			&momentoID, &authorID, &authorName, &authorUsername, &authorAvatar,
			&mediaURL, &textNote, &expiresInHours, &hasViewed, &createdAt,
		)
		if err != nil {
			return nil, err
		}

		item := MomentoItem{
			ID:             momentoID,
			MediaURL:       mediaURL,
			TextNote:       textNote,
			ExpiresInHours: expiresInHours,
			HasViewed:      hasViewed,
			CreatedAt:      createdAt,
		}

		group, exists := groupMap[authorID]
		if !exists {
			group = &AuthorMomentosGroup{
				AuthorID:       authorID,
				AuthorName:     authorName,
				AuthorUsername: authorUsername,
				AuthorAvatar:   authorAvatar,
				HasUnviewed:    !hasViewed,
				Stories:        []MomentoItem{item},
			}
			groupMap[authorID] = group
			order = append(order, authorID)
		} else {
			group.Stories = append(group.Stories, item)
			if !hasViewed {
				group.HasUnviewed = true
			}
		}
	}

	var result []AuthorMomentosGroup
	for _, id := range order {
		result = append(result, *groupMap[id])
	}

	return result, nil
}

// MarkMomentoViewed marca um momento específico como visualizado pelo usuário
func (s *MomentoService) MarkMomentoViewed(ctx context.Context, momentoID, viewerID string) error {
	query := `
		INSERT INTO momento_views (momento_id, viewer_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING;
	`
	_, err := s.db.Exec(ctx, query, momentoID, viewerID)
	return err
}
