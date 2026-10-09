package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/slowsocial/backend/internal/config"
)

// Tópicos Principais do Kafka
const (
	TopicPostCreated      = "post.created"
	TopicPostReacted      = "post.reacted"
	TopicMediaTranscode   = "media.transcode"
	TopicNotificationPush = "notification.push"
)

// Estruturas de Eventos Tipados
type PostCreatedEvent struct {
	PostID    string    `json:"post_id"`
	AuthorID  string    `json:"author_id"`
	CreatedAt time.Time `json:"created_at"`
}

type PostReactedEvent struct {
	UserID       string    `json:"user_id"`
	TargetType   string    `json:"target_type"`
	TargetID     string    `json:"target_id"`
	ReactionType string    `json:"reaction_type"`
	CreatedAt    time.Time `json:"created_at"`
}

type MediaTranscodeEvent struct {
	MediaID      string `json:"media_id"`
	OriginalURL  string `json:"original_url"`
	TargetBucket string `json:"target_bucket"`
	MediaType    string `json:"media_type"` // video, audio
}

type NotificationPushEvent struct {
	RecipientID string `json:"recipient_id"`
	Title       string `json:"title"`
	Body        string `json:"body"`
	DeepLink    string `json:"deep_link"`
}

type KafkaProducer struct {
	writer *kafka.Writer
}

func NewKafkaProducer(cfg *config.Config) *KafkaProducer {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(cfg.KafkaBrokers...),
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 10 * time.Millisecond,
		Async:        true,
	}

	return &KafkaProducer{writer: writer}
}

func (p *KafkaProducer) Publish(ctx context.Context, topic string, key string, payload interface{}) error {
	bytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("erro ao serializar evento kafka: %w", err)
	}

	msg := kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: bytes,
		Time:  time.Now(),
	}

	return p.writer.WriteMessages(ctx, msg)
}

func (p *KafkaProducer) Close() error {
	if p.writer != nil {
		return p.writer.Close()
	}
	return nil
}

// KafkaConsumer representa um consumidor de um tópico específico
type KafkaConsumer struct {
	reader *kafka.Reader
}

func NewKafkaConsumer(cfg *config.Config, topic string) *KafkaConsumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  cfg.KafkaBrokers,
		GroupID:  cfg.KafkaConsumerGroup,
		Topic:    topic,
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})

	return &KafkaConsumer{reader: reader}
}

func (c *KafkaConsumer) StartConsuming(ctx context.Context, handler func(msg kafka.Message) error) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			default:
				m, err := c.reader.FetchMessage(ctx)
				if err != nil {
					log.Printf("[Kafka] Erro ao buscar mensagem: %v", err)
					continue
				}

				if err := handler(m); err != nil {
					log.Printf("[Kafka] Erro ao processar mensagem %s: %v", string(m.Key), err)
				} else {
					_ = c.reader.CommitMessages(ctx, m)
				}
			}
		}
	}()
}

func (c *KafkaConsumer) Close() error {
	if c.reader != nil {
		return c.reader.Close()
	}
	return nil
}
