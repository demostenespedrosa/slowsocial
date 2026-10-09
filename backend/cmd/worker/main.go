package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/segmentio/kafka-go"
	"github.com/slowsocial/backend/internal/cache"
	"github.com/slowsocial/backend/internal/config"
	"github.com/slowsocial/backend/internal/database"
	"github.com/slowsocial/backend/internal/events"
	"github.com/slowsocial/backend/internal/media"
)

func main() {
	cfg := config.Load()
	log.Printf("==========================================================")
	log.Printf("⚙️ INICIANDO SLOWSOCIAL ASYNC WORKER (Kafka + FFmpeg)")
	log.Printf("==========================================================")

	// 1. Conexão com PostgreSQL
	db, err := database.NewPostgres(cfg)
	if err != nil {
		log.Fatalf("❌ Falha ao conectar ao PostgreSQL no Worker: %v", err)
	}
	defer db.Close()

	// 2. Conexão com Redis
	redisClient, err := cache.NewRedis(cfg)
	if err != nil {
		log.Fatalf("❌ Falha ao conectar ao Redis no Worker: %v", err)
	}
	defer redisClient.Close()

	// 3. Processador FFmpeg
	ffmpeg := media.NewFFmpegProcessor()
	_ = ffmpeg // Disponível para jobs de vídeo

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 4. Consumidor Kafka: Fan-out de Posts Criados
	postConsumer := events.NewKafkaConsumer(cfg, events.TopicPostCreated)
	defer postConsumer.Close()

	postConsumer.StartConsuming(ctx, func(msg kafka.Message) error {
		var event events.PostCreatedEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			return err
		}

		log.Printf("[Worker] Processando fan-out para PostID: %s do Autor: %s", event.PostID, event.AuthorID)

		// Buscar todas as conexões ativas desse autor no PostgreSQL
		query := `
			SELECT user_b_id FROM connections WHERE user_a_id = $1 AND status = 'active'
			UNION
			SELECT user_a_id FROM connections WHERE user_b_id = $1 AND status = 'active';
		`
		rows, err := db.Pool.Query(ctx, query, event.AuthorID)
		if err != nil {
			return err
		}
		defer rows.Close()

		var count int
		for rows.Next() {
			var connectionUserID string
			if err := rows.Scan(&connectionUserID); err == nil {
				// Adiciona na timeline do amigo no Redis ZSET
				_ = redisClient.PushToTimeline(ctx, connectionUserID, event.PostID, event.CreatedAt.Unix())
				count++
			}
		}

		log.Printf("[Worker] Fan-out concluído para %d conexões do autor %s", count, event.AuthorID)
		return nil
	})

	log.Printf("✅ Worker Kafka ativo escutando tópicos: [%s, %s]", events.TopicPostCreated, events.TopicMediaTranscode)

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Encerrando SlowSocial Worker...")
	cancel()
	log.Println("✨ Worker finalizado limpo.")
}
