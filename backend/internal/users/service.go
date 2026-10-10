package users

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserProfile struct {
	ID                string    `json:"id"`
	Username          string    `json:"username"`
	Email             string    `json:"email"`
	FullName          string    `json:"full_name"`
	AvatarURL         string    `json:"avatar_url"`
	Headline          string    `json:"headline"`
	Bio               string    `json:"bio"`
	Location          string    `json:"location"`
	Pronouns          string    `json:"pronouns"`
	DegreeLevel       int       `json:"degree_level"`
	TestimonialTokens int       `json:"testimonial_tokens"`
	ConnectionStatus  string    `json:"connection_status"` // 'self', 'none', 'pending', 'active'
	CreatedAt         time.Time `json:"created_at"`
}

type ProfileUpdate struct {
	FullName  *string `json:"full_name"`
	Headline  *string `json:"headline"`
	Bio       *string `json:"bio"`
	Location  *string `json:"location"`
	Pronouns  *string `json:"pronouns"`
	AvatarURL *string `json:"avatar_url"`
}

type UserService struct {
	pool *pgxpool.Pool
}

func NewUserService(pool *pgxpool.Pool) *UserService {
	return &UserService{pool: pool}
}

// GetProfile busca o perfil de um usuário e calcula o status de conexão em relação ao solicitante
func (s *UserService) GetProfile(ctx context.Context, targetUserID, currentUserID string) (*UserProfile, error) {
	query := `
		SELECT 
			id, username, email, full_name, 
			COALESCE(avatar_url, ''), 
			COALESCE(headline, ''), 
			COALESCE(bio, ''), 
			COALESCE(location, ''), 
			COALESCE(pronouns, ''), 
			degree_level, testimonial_tokens, created_at
		FROM users
		WHERE id = $1;
	`

	var p UserProfile
	err := s.pool.QueryRow(ctx, query, targetUserID).Scan(
		&p.ID, &p.Username, &p.Email, &p.FullName,
		&p.AvatarURL, &p.Headline, &p.Bio, &p.Location,
		&p.Pronouns, &p.DegreeLevel, &p.TestimonialTokens, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("usuário não encontrado: %w", err)
	}

	if targetUserID == currentUserID {
		p.ConnectionStatus = "self"
	} else {
		// Checar status de conexão na tabela connections
		connQuery := `
			SELECT status FROM connections 
			WHERE (user_a_id = $1 AND user_b_id = $2)
			   OR (user_a_id = $2 AND user_b_id = $1)
			LIMIT 1;
		`
		var status string
		err := s.pool.QueryRow(ctx, connQuery, currentUserID, targetUserID).Scan(&status)
		if err != nil {
			p.ConnectionStatus = "none"
		} else {
			p.ConnectionStatus = status
		}
	}

	return &p, nil
}

// UpdateProfile atualiza informações do perfil do usuário autenticado
func (s *UserService) UpdateProfile(ctx context.Context, userID string, update ProfileUpdate) (*UserProfile, error) {
	query := `
		UPDATE users
		SET 
			full_name = COALESCE($1, full_name),
			headline = COALESCE($2, headline),
			bio = COALESCE($3, bio),
			location = COALESCE($4, location),
			pronouns = COALESCE($5, pronouns),
			avatar_url = COALESCE($6, avatar_url),
			updated_at = NOW()
		WHERE id = $7
		RETURNING id, username, email, full_name, 
		          COALESCE(avatar_url, ''), COALESCE(headline, ''), 
		          COALESCE(bio, ''), COALESCE(location, ''), 
		          COALESCE(pronouns, ''), degree_level, testimonial_tokens, created_at;
	`

	var p UserProfile
	err := s.pool.QueryRow(ctx, query,
		updateFullName(update.FullName),
		updateField(update.Headline),
		updateField(update.Bio),
		updateField(update.Location),
		updateField(update.Pronouns),
		updateField(update.AvatarURL),
		userID,
	).Scan(
		&p.ID, &p.Username, &p.Email, &p.FullName,
		&p.AvatarURL, &p.Headline, &p.Bio, &p.Location,
		&p.Pronouns, &p.DegreeLevel, &p.TestimonialTokens, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("erro ao atualizar perfil: %w", err)
	}
	p.ConnectionStatus = "self"
	return &p, nil
}

func updateField(val *string) interface{} {
	if val == nil {
		return nil
	}
	return *val
}

func updateFullName(val *string) interface{} {
	if val == nil || *val == "" {
		return nil
	}
	return *val
}
