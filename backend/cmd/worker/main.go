package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/segmentio/kafka-go"
	"github.com/slowsocial/backend/internal/cache"
	"github.com/slowsocial/backend/internal/config"
	"github.com/slowsocial/backend/internal/database"
	"github.com/slowsocial/backend/internal/events"
	"github.com/slowsocial/backend/internal/media"
	"github.com/slowsocial/backend/internal/push"
)

func main() {
	cfg := config.Load()
	log.Printf("==========================================================")
	log.Printf("⚙️ INICIANDO SLOWSOCIAL ASYNC WORKER (Kafka + FFmpeg + FCM)")
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

	// 3. Processador FFmpeg & FCM
	ffmpeg := media.NewFFmpegProcessor()
	fcmService := push.NewFCMService(cfg)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// -------------------------------------------------------------
	// 4. Consumidor Kafka: Fan-out de Posts Criados
	// -------------------------------------------------------------
	postConsumer := events.NewKafkaConsumer(cfg, events.TopicPostCreated)
	defer postConsumer.Close()

	postConsumer.StartConsuming(ctx, func(msg kafka.Message) error {
		var event events.PostCreatedEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			return err
		}

		log.Printf("[Worker] Processando fan-out para PostID: %s do Autor: %s", event.PostID, event.AuthorID)

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
				_ = redisClient.PushToTimeline(ctx, connectionUserID, event.PostID, event.CreatedAt.Unix())
				count++
			}
		}

		log.Printf("[Worker] Fan-out concluído para %d conexões do autor %s", count, event.AuthorID)
		return nil
	})

	// -------------------------------------------------------------
	// 5. Consumidor Kafka: Transcodificação FFmpeg (HLS & Thumbnails)
	// -------------------------------------------------------------
	mediaConsumer := events.NewKafkaConsumer(cfg, events.TopicMediaTranscode)
	defer mediaConsumer.Close()

	mediaConsumer.StartConsuming(ctx, func(msg kafka.Message) error {
		var event events.MediaTranscodeEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			return err
		}

		log.Printf("[Worker FFmpeg] Iniciando transcodificação para MediaID: %s (Tipo: %s)", event.MediaID, event.MediaType)

		// Diretório temporário para processamento local dos chunks
		workDir := filepath.Join(os.TempDir(), "slowsocial_transcode", event.MediaID)
		_ = os.MkdirAll(workDir, 0755)
		defer os.RemoveAll(workDir)

		thumbPath := filepath.Join(workDir, "thumbnail.jpg")
		hlsDir := filepath.Join(workDir, "hls")
		_ = os.MkdirAll(hlsDir, 0755)

		// 1. Gerar Thumbnail
		if err := ffmpeg.GenerateThumbnail(ctx, event.OriginalURL, thumbPath); err != nil {
			log.Printf("[Worker FFmpeg] Aviso ao gerar thumbnail para %s: %v", event.MediaID, err)
		} else {
			log.Printf("[Worker FFmpeg] Thumbnail gerada com sucesso: %s", thumbPath)
		}

		// 2. Converte para HLS streaming adaptativo
		if event.MediaType == "video" {
			if err := ffmpeg.TranscodeHLS(ctx, event.OriginalURL, hlsDir); err != nil {
				log.Printf("[Worker FFmpeg] Erro ao transcodificar HLS para %s: %v", event.MediaID, err)
				return err
			}
			log.Printf("[Worker FFmpeg] HLS concluído com sucesso para %s", event.MediaID)
		}

		return nil
	})

	// -------------------------------------------------------------
	// 6. Consumidor Kafka: Notificações Push FCM
	// -------------------------------------------------------------
	pushConsumer := events.NewKafkaConsumer(cfg, events.TopicNotificationPush)
	defer pushConsumer.Close()

	pushConsumer.StartConsuming(ctx, func(msg kafka.Message) error {
		var event events.NotificationPushEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			return err
		}

		log.Printf("[Worker FCM] Enviando push para RecipientID: %s (Título: '%s')", event.RecipientID, event.Title)

		// Buscar token FCM do usuário no banco (ou simulação com chave de teste)
		data := map[string]string{
			"deep_link":    event.DeepLink,
			"recipient_id": event.RecipientID,
		}

		deviceToken := fmt.Sprintf("token_%s", event.RecipientID)
		_ = fcmService.SendPushNotification(ctx, deviceToken, event.Title, event.Body, data)

		return nil
	})

	log.Printf("✅ SlowSocial Worker escutando 3 tópicos Kafka com sucesso:")
	log.Printf("   1. %s (Fan-out de timeline)", events.TopicPostCreated)
	log.Printf("   2. %s (Transcodificação FFmpeg)", events.TopicMediaTranscode)
	log.Printf("   3. %s (Notificações Push FCM)", events.TopicNotificationPush)

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Encerrando SlowSocial Worker...")
	cancel()
	log.Println("✨ Worker finalizado limpo.")
}
