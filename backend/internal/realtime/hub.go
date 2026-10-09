package realtime

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512 KB
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Configurado pelo CORS no gateway
	},
}

type WSMessage struct {
	Type      string          `json:"type"` // "chat_message", "typing", "reaction", "presence"
	SenderID  string          `json:"sender_id,omitempty"`
	TargetID  string          `json:"target_id,omitempty"`
	Payload   json.RawMessage `json:"payload"`
	CreatedAt time.Time       `json:"created_at"`
}

type Client struct {
	Hub    *Hub
	Conn   *websocket.Conn
	UserID string
	Send   chan []byte
}

type Hub struct {
	clients     map[*Client]bool
	userClients map[string]map[*Client]bool
	broadcast   chan []byte
	register    chan *Client
	unregister  chan *Client
	mu          sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		broadcast:   make(chan []byte, 256),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		clients:     make(map[*Client]bool),
		userClients: make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			if _, ok := h.userClients[client.UserID]; !ok {
				h.userClients[client.UserID] = make(map[*Client]bool)
			}
			h.userClients[client.UserID][client] = true
			h.mu.Unlock()
			log.Printf("[WebSocket] Usuário conectado: %s (Total de clientes: %d)", client.UserID, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				if clientsMap, exists := h.userClients[client.UserID]; exists {
					delete(clientsMap, client)
					if len(clientsMap) == 0 {
						delete(h.userClients, client.UserID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("[WebSocket] Usuário desconectado: %s", client.UserID)

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// SendToUser envia uma mensagem privada para todas as conexões ativas de um usuário
func (h *Hub) SendToUser(userID string, msg WSMessage) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clientsMap, exists := h.userClients[userID]
	if !exists || len(clientsMap) == 0 {
		return false // Usuário offline
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return false
	}

	for client := range clientsMap {
		select {
		case client.Send <- data:
		default:
			// Buffer cheio
		}
	}
	return true
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		_ = c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WebSocket] Erro na leitura do cliente %s: %v", c.UserID, err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err == nil {
			wsMsg.SenderID = c.UserID
			wsMsg.CreatedAt = time.Now()

			// Se tiver destinatário, roteia diretamente
			if wsMsg.TargetID != "" {
				c.Hub.SendToUser(wsMsg.TargetID, wsMsg)
			}
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			// Concatena mensagens enfileiradas para otimização de I/O
			n := len(c.Send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte{'\n'})
				_, _ = w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request, userID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WebSocket] Falha no handshake: %v", err)
		return
	}

	client := &Client{
		Hub:    hub,
		Conn:   conn,
		UserID: userID,
		Send:   make(chan []byte, 256),
	}

	hub.register <- client

	go client.WritePump()
	go client.ReadPump()
}
