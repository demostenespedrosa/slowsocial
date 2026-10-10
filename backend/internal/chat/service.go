package chat

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/slowsocial/backend/internal/push"
	"github.com/slowsocial/backend/internal/realtime"
)

type ConversationItem struct {
	ID                 string    `json:"id"`
	Tab                string    `json:"tab"` // direct, request
	PartnerID          string    `json:"partner_id"`
	PartnerName        string    `json:"partner_name"`
	PartnerAvatar      string    `json:"partner_avatar"`
	Subject            *string   `json:"subject,omitempty"`
	Status             string    `json:"status"`
	LastMessagePreview string    `json:"last_message_preview"`
	LastMessageAt      time.Time `json:"last_message_at"`
	UnreadCount        int       `json:"unread_count"`
}

type MessageItem struct {
	ID             string          `json:"id"`
	ConversationID string          `json:"conversation_id"`
	SenderID       string          `json:"sender_id"`
	Content        string          `json:"content"`
	AudioURL       *string         `json:"audio_url,omitempty"`
	Attachments    json.RawMessage `json:"attachments,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	ReadAt         *time.Time      `json:"read_at,omitempty"`
}

type ChatService struct {
	db    *pgxpool.Pool
	hub   *realtime.Hub
	push  *push.FCMService
}

func NewChatService(db *pgxpool.Pool, hub *realtime.Hub, push *push.FCMService) *ChatService {
	return &ChatService{
		db:   db,
		hub:  hub,
		push: push,
	}
}

// GetUserConversations lista as conversas ativas do usuário divididas por abas
func (s *ChatService) GetUserConversations(ctx context.Context, userID, tab string) ([]ConversationItem, error) {
	query := `
		SELECT 
			c.id, c.tab,
			CASE WHEN c.participant_a_id = $1 THEN c.participant_b_id ELSE c.participant_a_id END as partner_id,
			u.full_name as partner_name, COALESCE(u.avatar_url, '') as partner_avatar,
			c.subject, c.status, COALESCE(c.last_message_preview, ''), c.last_message_at
		FROM conversations c
		JOIN users u ON u.id = (CASE WHEN c.participant_a_id = $1 THEN c.participant_b_id ELSE c.participant_a_id END)
		WHERE (c.participant_a_id = $1 OR c.participant_b_id = $1)
		  AND ($2 = '' OR c.tab = $2)
		ORDER BY c.last_message_at DESC;
	`

	rows, err := s.db.Query(ctx, query, userID, tab)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar conversas: %w", err)
	}
	defer rows.Close()

	var list []ConversationItem
	for rows.Next() {
		var item ConversationItem
		err := rows.Scan(
			&item.ID, &item.Tab, &item.PartnerID, &item.PartnerName, &item.PartnerAvatar,
			&item.Subject, &item.Status, &item.LastMessagePreview, &item.LastMessageAt,
		)
		if err == nil {
			list = append(list, item)
		}
	}

	return list, nil
}

// SendMessage envia uma mensagem privada, persiste no PostgreSQL e faz streaming no WebSocket
func (s *ChatService) SendMessage(ctx context.Context, conversationID, senderID, content string) (*MessageItem, error) {
	msgID := uuid.New().String()
	now := time.Now()

	// 1. Inserir mensagem
	insertQuery := `
		INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at;
	`
	err := s.db.QueryRow(ctx, insertQuery, msgID, conversationID, senderID, content, now).Scan(&now)
	if err != nil {
		return nil, fmt.Errorf("falha ao salvar mensagem: %w", err)
	}

	// 2. Atualizar resumo da conversa e identificar o destinatário
	updateQuery := `
		UPDATE conversations
		SET last_message_preview = $1, last_message_at = $2
		WHERE id = $3
		RETURNING 
			CASE WHEN participant_a_id = $4 THEN participant_b_id ELSE participant_a_id END;
	`
	var recipientID string
	err = s.db.QueryRow(ctx, updateQuery, content, now, conversationID, senderID).Scan(&recipientID)
	if err != nil {
		return nil, fmt.Errorf("falha ao atualizar conversa: %w", err)
	}

	msg := &MessageItem{
		ID:             msgID,
		ConversationID: conversationID,
		SenderID:       senderID,
		Content:        content,
		CreatedAt:      now,
	}

	// 3. Notificar via WebSocket em tempo real
	payload, _ := json.Marshal(msg)
	delivered := s.hub.SendToUser(recipientID, realtime.WSMessage{
		Type:      "chat_message",
		SenderID:  senderID,
		TargetID:  recipientID,
		Payload:   payload,
		CreatedAt: now,
	})

	// 4. Se o usuário estiver offline, enviar push notification
	if !delivered {
		go func() {
			_ = s.push.SendPushNotification(context.Background(), recipientID, "Nova mensagem", content, map[string]string{
				"conversation_id": conversationID,
				"sender_id":       senderID,
			})
		}()
	}

	return msg, nil
}
