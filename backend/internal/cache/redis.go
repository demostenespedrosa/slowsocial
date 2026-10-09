package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/slowsocial/backend/internal/config"
)

type RedisClient struct {
	Client *redis.Client
}

func NewRedis(cfg *config.Config) (*RedisClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("falha ao conectar ao redis: %w", err)
	}

	return &RedisClient{Client: client}, nil
}

func (r *RedisClient) Close() error {
	if r.Client != nil {
		return r.Client.Close()
	}
	return nil
}

// PushToTimeline adiciona um postId na ZSET da timeline de um usuário ordenado por timestamp
func (r *RedisClient) PushToTimeline(ctx context.Context, userID, postID string, timestamp int64) error {
	key := fmt.Sprintf("timeline:%s", userID)
	return r.Client.ZAdd(ctx, key, redis.Z{
		Score:  float64(timestamp),
		Member: postID,
	}).Err()
}

// GetTimeline recupera IDs de posts da timeline com paginação por offset/limit
func (r *RedisClient) GetTimeline(ctx context.Context, userID string, start, stop int64) ([]string, error) {
	key := fmt.Sprintf("timeline:%s", userID)
	// ZRevRange busca os mais recentes (maior score) primeiro
	return r.Client.ZRevRange(ctx, key, start, stop).Result()
}

// SetUserPresence atualiza o status online de um usuário com TTL de 60 segundos
func (r *RedisClient) SetUserPresence(ctx context.Context, userID string) error {
	key := fmt.Sprintf("presence:%s", userID)
	return r.Client.Set(ctx, key, "online", 60*time.Second).Err()
}

// IsUserOnline verifica se o usuário está ativo
func (r *RedisClient) IsUserOnline(ctx context.Context, userID string) (bool, error) {
	key := fmt.Sprintf("presence:%s", userID)
	val, err := r.Client.Get(ctx, key).Result()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return val == "online", nil
}
