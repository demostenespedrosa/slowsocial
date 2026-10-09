package feed

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/slowsocial/backend/internal/cache"
)

type PostSummary struct {
	ID             string          `json:"id"`
	AuthorID       string          `json:"author_id"`
	AuthorName     string          `json:"author_name"`
	AuthorUsername string          `json:"author_username"`
	AuthorAvatar   string          `json:"author_avatar"`
	AuthorHeadline string          `json:"author_headline"`
	Content        string          `json:"content"`
	FormatType     string          `json:"format_type"`
	MediaURLs      json.RawMessage `json:"media_urls"`
	CodeSnippet    json.RawMessage `json:"code_snippet,omitempty"`
	AudioNote      json.RawMessage `json:"audio_note,omitempty"`
	AspectRatio    string          `json:"aspect_ratio"`
	ReactionsCount int             `json:"reactions_count"`
	ResponsesCount int             `json:"responses_count"`
	SavedCount     int             `json:"saved_count"`
	UserReaction   *string         `json:"user_reaction,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
}

type FeedService struct {
	db    *pgxpool.Pool
	redis *cache.RedisClient
}

func NewFeedService(db *pgxpool.Pool, r *cache.RedisClient) *FeedService {
	return &FeedService{
		db:    db,
		redis: r,
	}
}

// GetConnectionsFeed busca o feed cronológico de 1º grau (priorizando cache Redis)
func (s *FeedService) GetConnectionsFeed(ctx context.Context, userID string, limit, offset int) ([]PostSummary, error) {
	// 1. Tentar obter IDs da timeline no Redis ZSET
	cachedPostIDs, err := s.redis.GetTimeline(ctx, userID, int64(offset), int64(offset+limit-1))
	if err == nil && len(cachedPostIDs) > 0 {
		// Cache hit! Carregar dados estruturados
		return s.fetchPostsByIDs(ctx, cachedPostIDs, userID)
	}

	// 2. Fallback: Consulta otimizada no PostgreSQL
	query := `
		SELECT 
			p.id, p.author_id, u.full_name, u.username, COALESCE(u.avatar_url, ''), COALESCE(u.headline, ''),
			p.content, p.format_type, COALESCE(p.media_urls, '[]'::jsonb), p.code_snippet, p.audio_note,
			p.aspect_ratio, p.reactions_count, p.responses_count, p.saved_count,
			r.reaction_type, p.created_at
		FROM posts p
		JOIN users u ON u.id = p.author_id
		LEFT JOIN connections c ON (c.user_b_id = p.author_id AND c.user_a_id = $1 AND c.status = 'active')
		LEFT JOIN reactions r ON (r.target_id = p.id AND r.user_id = $1 AND r.target_type = 'post')
		WHERE (p.author_id = $1 OR c.id IS NOT NULL)
		ORDER BY p.created_at DESC
		LIMIT $2 OFFSET $3;
	`

	rows, err := s.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("erro ao consultar feed no postgres: %w", err)
	}
	defer rows.Close()

	var posts []PostSummary
	for rows.Next() {
		var p PostSummary
		var reactionType *string
		err := rows.Scan(
			&p.ID, &p.AuthorID, &p.AuthorName, &p.AuthorUsername, &p.AuthorAvatar, &p.AuthorHeadline,
			&p.Content, &p.FormatType, &p.MediaURLs, &p.CodeSnippet, &p.AudioNote,
			&p.AspectRatio, &p.ReactionsCount, &p.ResponsesCount, &p.SavedCount,
			&reactionType, &p.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao mapear post do feed: %w", err)
		}
		p.UserReaction = reactionType
		posts = append(posts, p)

		// Repopula o Redis assincronamente
		_ = s.redis.PushToTimeline(ctx, userID, p.ID, p.CreatedAt.Unix())
	}

	return posts, nil
}

func (s *FeedService) fetchPostsByIDs(ctx context.Context, postIDs []string, userID string) ([]PostSummary, error) {
	query := `
		SELECT 
			p.id, p.author_id, u.full_name, u.username, COALESCE(u.avatar_url, ''), COALESCE(u.headline, ''),
			p.content, p.format_type, COALESCE(p.media_urls, '[]'::jsonb), p.code_snippet, p.audio_note,
			p.aspect_ratio, p.reactions_count, p.responses_count, p.saved_count,
			r.reaction_type, p.created_at
		FROM posts p
		JOIN users u ON u.id = p.author_id
		LEFT JOIN reactions r ON (r.target_id = p.id AND r.user_id = $1 AND r.target_type = 'post')
		WHERE p.id = ANY($2)
		ORDER BY p.created_at DESC;
	`

	rows, err := s.db.Query(ctx, query, userID, postIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []PostSummary
	for rows.Next() {
		var p PostSummary
		var reactionType *string
		if err := rows.Scan(
			&p.ID, &p.AuthorID, &p.AuthorName, &p.AuthorUsername, &p.AuthorAvatar, &p.AuthorHeadline,
			&p.Content, &p.FormatType, &p.MediaURLs, &p.CodeSnippet, &p.AudioNote,
			&p.AspectRatio, &p.ReactionsCount, &p.ResponsesCount, &p.SavedCount,
			&reactionType, &p.CreatedAt,
		); err == nil {
			p.UserReaction = reactionType
			posts = append(posts, p)
		}
	}
	return posts, nil
}
