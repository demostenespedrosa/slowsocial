package push

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/slowsocial/backend/internal/config"
)

type FCMService struct {
	serverKey  string
	httpClient *http.Client
}

type PushNotificationPayload struct {
	To           string            `json:"to"` // Device Token ou Tópico
	Notification NotificationBody  `json:"notification"`
	Data         map[string]string `json:"data,omitempty"`
	Priority     string            `json:"priority"` // "high"
}

type NotificationBody struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	Sound string `json:"sound"`
}

func NewFCMService(cfg *config.Config) *FCMService {
	return &FCMService{
		serverKey: cfg.SupabaseJWTSecret, // Chave FCM configurada via env
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SendPushNotification despacha notificação push para Android e iOS
func (f *FCMService) SendPushNotification(ctx context.Context, deviceToken, title, body string, data map[string]string) error {
	if deviceToken == "" {
		return nil // Dispositivo sem token registrado
	}

	payload := PushNotificationPayload{
		To: deviceToken,
		Notification: NotificationBody{
			Title: title,
			Body:  body,
			Sound: "default",
		},
		Data:     data,
		Priority: "high",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("erro ao serializar payload push: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://fcm.googleapis.com/fcm/send", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "key="+f.serverKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := f.httpClient.Do(req)
	if err != nil {
		log.Printf("[FCM] Falha ao enviar push: %v", err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[FCM] Resposta não-200 do Firebase: %d", resp.StatusCode)
	} else {
		log.Printf("[FCM] Push disparado com sucesso para token: %s...", deviceToken[:min(len(deviceToken), 10)])
	}

	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
