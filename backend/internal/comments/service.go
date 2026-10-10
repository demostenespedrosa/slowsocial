package comments

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Comment struct {
	ID             string    `json:"id"`
	PostID         string    `json:"post_id"`
	AuthorID       string    `json:"author_id"`
	AuthorName     string    `json:"author_name"`
	AuthorUsername string    `json:"author_username"`
	AuthorAvatar   string    `json:"author_avatar"`
	ParentID       *string   `json:"parent_id,omitempty"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
}

type CommentService struct {
	pool *pgxpool.Pool
}

func NewCommentService(pool *pgxpool.Pool) *CommentService {
	return &CommentService{pool: pool}
}

// GetCommentsByPostID busca todos os comentários de uma publicação com dados dos autores
func (s *CommentService) GetCommentsByPostID(ctx context.Context, postID string) ([]Comment, error) {
	query := `
		SELECT 
			c.id, c.post_id, c.author_id, 
			COALESCE(u.full_name, 'Anônimo') as author_name,
			COALESCE(u.username, 'usuario') as author_username,
			COALESCE(u.avatar_url, '') as author_avatar,
			c.parent_id, c.content, c.created_at
		FROM comments c
		LEFT JOIN users u ON u.id = c.author_id
		WHERE c.post_id = $1
		ORDER BY c.created_at ASC;
	`

	rows, err := s.pool.Query(ctx, query, postID)
	if err != nil {
		return nil, fmt.Errorf("erro ao consultar comentários: %w", err)
	}
	defer rows.Close()

	var result []Comment
	for rows.Next() {
		var c Comment
		var parentID *string
		err := rows.Scan(
			&c.ID, &c.PostID, &c.AuthorID,
			&c.AuthorName, &c.AuthorUsername, &c.AuthorAvatar,
			&parentID, &c.Content, &c.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear comentário: %w", err)
		}
		c.ParentID = parentID
		result = append(result, c)
	}

	if result == nil {
		result = []Comment{}
	}

	return result, nil
}

// CreateComment insere um novo comentário, incrementa o contador e gera notificação
func (s *CommentService) CreateComment(ctx context.Context, postID, authorID, content string, parentID *string) (*Comment, error) {
	commentID := uuid.New().String()

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("erro ao iniciar transação: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Inserir comentário
	insertQuery := `
		INSERT INTO comments (id, post_id, author_id, parent_id, content, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING created_at;
	`
	var createdAt time.Time
	err = tx.QueryRow(ctx, insertQuery, commentID, postID, authorID, parentID, content).Scan(&createdAt)
	if err != nil {
		return nil, fmt.Errorf("erro ao inserir comentário: %w", err)
	}

	// 2. Incrementar contagem de respostas no post
	updatePostQuery := `
		UPDATE posts 
		SET responses_count = responses_count + 1, updated_at = NOW() 
		WHERE id = $1 
		RETURNING author_id;
	`
	var postAuthorID string
	err = tx.QueryRow(ctx, updatePostQuery, postID).Scan(&postAuthorID)
	if err != nil {
		return nil, fmt.Errorf("erro ao atualizar contagem do post: %w", err)
	}

	// 3. Gerar Notificação para o autor do post (se não for o próprio autor comentando)
	if postAuthorID != authorID {
		notifQuery := `
			INSERT INTO notifications (id, recipient_id, actor_id, type, title, detail, reference_id, is_read, created_at)
			VALUES ($1, $2, $3, 'comment', 'Novo comentário na sua publicação', $4, $5, false, NOW());
		`
		detail := content
		if len(detail) > 100 {
			detail = detail[:97] + "..."
		}
		_, _ = tx.Exec(ctx, notifQuery, uuid.New().String(), postAuthorID, authorID, detail, postID)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("erro ao confirmar transação: %w", err)
	}

	// 4. Buscar dados do autor para retorno completo
	var authorName, authorUsername, authorAvatar string
	userQuery := `SELECT full_name, username, COALESCE(avatar_url, '') FROM users WHERE id = $1;`
	_ = s.pool.QueryRow(ctx, userQuery, authorID).Scan(&authorName, &authorUsername, &authorAvatar)

	return &Comment{
		ID:             commentID,
		PostID:         postID,
		AuthorID:       authorID,
		AuthorName:     authorName,
		AuthorUsername: authorUsername,
		AuthorAvatar:   authorAvatar,
		ParentID:       parentID,
		Content:        content,
		CreatedAt:      createdAt,
	}, nil
}
