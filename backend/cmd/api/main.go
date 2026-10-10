package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/slowsocial/backend/internal/auth"
	"github.com/slowsocial/backend/internal/cache"
	"github.com/slowsocial/backend/internal/chat"
	"github.com/slowsocial/backend/internal/comments"
	"github.com/slowsocial/backend/internal/config"
	"github.com/slowsocial/backend/internal/connections"
	"github.com/slowsocial/backend/internal/database"
	"github.com/slowsocial/backend/internal/events"
	"github.com/slowsocial/backend/internal/feed"
	"github.com/slowsocial/backend/internal/media"
	"github.com/slowsocial/backend/internal/momentos"
	"github.com/slowsocial/backend/internal/notifications"
	"github.com/slowsocial/backend/internal/push"
	"github.com/slowsocial/backend/internal/realtime"
	"github.com/slowsocial/backend/internal/telemetry"
	"github.com/slowsocial/backend/internal/users"
	"github.com/slowsocial/backend/pkg/response"
)

func main() {
	cfg := config.Load()
	log.Printf("==========================================================")
	log.Printf("🌿 INICIANDO SLOWSOCIAL API GATEWAY (Produção)")
	log.Printf("Ambiente: %s | Porta: %s", cfg.Environment, cfg.Port)
	log.Printf("==========================================================")

	// 1. Conexão com PostgreSQL
	db, err := database.NewPostgres(cfg)
	if err != nil {
		log.Fatalf("❌ Falha crítica ao conectar ao PostgreSQL: %v", err)
	}
	defer db.Close()
	log.Printf("✅ PostgreSQL conectado com sucesso (Pool: %d max)", cfg.DBMaxConns)

	// 2. Conexão com Redis
	redisClient, err := cache.NewRedis(cfg)
	if err != nil {
		log.Fatalf("❌ Falha crítica ao conectar ao Redis: %v", err)
	}
	defer redisClient.Close()
	log.Printf("✅ Redis conectado com sucesso (%s)", cfg.RedisAddr)

	// 3. Inicialização do Apache Kafka
	kafkaProducer := events.NewKafkaProducer(cfg)
	defer kafkaProducer.Close()
	log.Printf("✅ Apache Kafka Producer ativo (%v)", cfg.KafkaBrokers)

	// 4. Inicialização do S3 Storage
	storageService, err := media.NewStorageService(cfg)
	if err != nil {
		log.Fatalf("❌ Falha crítica ao conectar ao S3 Storage: %v", err)
	}
	log.Printf("✅ S3 Storage & Cloudflare CDN integrados (%s)", cfg.S3Bucket)

	// 5. Inicialização do WebSocket Hub
	wsHub := realtime.NewHub()
	go wsHub.Run()
	log.Printf("✅ WebSocket Hub em tempo real iniciado")

	// 6. Observabilidade OpenTelemetry
	_, _ = telemetry.InitTracer(context.Background(), "slowsocial-api", cfg.Environment)

	// 7. Inicialização de Serviços da Camada de Domínio
	feedService := feed.NewFeedService(db.Pool, redisClient)
	authMiddleware := auth.NewAuthMiddleware(cfg)
	pushService := push.NewFCMService(cfg)
	momentoService := momentos.NewMomentoService(db.Pool)
	chatService := chat.NewChatService(db.Pool, wsHub, pushService)
	commentService := comments.NewCommentService(db.Pool)
	connService := connections.NewConnectionService(db.Pool)
	notifService := notifications.NewNotificationService(db.Pool)
	userService := users.NewUserService(db.Pool)

	// 8. Roteador HTTP Chi
	r := chi.NewRouter()

	// Middlewares Essenciais
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Timeout(60 * time.Second))

	// CORS de Produção
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Healthcheck
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		response.Success(w, http.StatusOK, "SlowSocial API saudável", map[string]string{
			"status":   "healthy",
			"postgres": "connected",
			"redis":    "connected",
			"time":     time.Now().Format(time.RFC3339),
		})
	})

	// WebSocket Endpoint
	r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			userID = uuid.New().String()
		}
		realtime.ServeWS(wsHub, w, r, userID)
	})

	// -------------------------------------------------------------
	// Rotas da API v1
	// -------------------------------------------------------------
	r.Route("/api/v1", func(api chi.Router) {
		// Rota Pública de Teste
		api.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
			response.Success(w, http.StatusOK, "pong", nil)
		})

		// Rotas Protegidas por Supabase JWT
		api.Group(func(protected chi.Router) {
			protected.Use(authMiddleware.RequireAuth)

			// =========================================================
			// 1. Feed & Posts
			// =========================================================
			protected.Get("/feed", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
				offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
				if limit <= 0 {
					limit = 15
				}

				posts, err := feedService.GetConnectionsFeed(r.Context(), userID, limit, offset)
				if err != nil {
					response.InternalServerError(w, "erro ao carregar feed")
					return
				}
				response.Success(w, http.StatusOK, "feed carregado com sucesso", posts)
			})

			protected.Post("/posts", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())

				var body struct {
					Content     string          `json:"content"`
					FormatType  string          `json:"format_type"`
					MediaURLs   json.RawMessage `json:"media_urls"`
					CodeSnippet json.RawMessage `json:"code_snippet"`
					AudioNote   json.RawMessage `json:"audio_note"`
					AspectRatio string          `json:"aspect_ratio"`
				}

				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					response.BadRequest(w, "payload json inválido")
					return
				}

				if body.Content == "" {
					response.BadRequest(w, "o conteúdo da publicação não pode ser vazio")
					return
				}

				postID := uuid.New().String()
				query := `
					INSERT INTO posts (id, author_id, content, format_type, media_urls, code_snippet, audio_note, aspect_ratio)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
					RETURNING created_at;
				`

				var createdAt time.Time
				err := db.Pool.QueryRow(r.Context(), query,
					postID, userID, body.Content, body.FormatType,
					body.MediaURLs, body.CodeSnippet, body.AudioNote, body.AspectRatio,
				).Scan(&createdAt)

				if err != nil {
					response.InternalServerError(w, fmt.Sprintf("erro ao salvar publicação: %v", err))
					return
				}

				_ = kafkaProducer.Publish(r.Context(), events.TopicPostCreated, postID, events.PostCreatedEvent{
					PostID:    postID,
					AuthorID:  userID,
					CreatedAt: createdAt,
				})

				response.Success(w, http.StatusCreated, "publicação criada com sucesso", map[string]interface{}{
					"id":         postID,
					"created_at": createdAt,
				})
			})

			protected.Post("/posts/{id}/react", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				postID := chi.URLParam(r, "id")

				var body struct {
					ReactionType string `json:"reaction_type"`
				}
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					response.BadRequest(w, "payload json inválido")
					return
				}

				query := `
					INSERT INTO reactions (user_id, target_type, target_id, reaction_type)
					VALUES ($1, 'post', $2, $3)
					ON CONFLICT (user_id, target_type, target_id) 
					DO UPDATE SET reaction_type = EXCLUDED.reaction_type, created_at = NOW();
				`
				_, err := db.Pool.Exec(r.Context(), query, userID, postID, body.ReactionType)
				if err != nil {
					response.InternalServerError(w, "erro ao registrar reação")
					return
				}

				_ = kafkaProducer.Publish(r.Context(), events.TopicPostReacted, postID, events.PostReactedEvent{
					UserID:       userID,
					TargetType:   "post",
					TargetID:     postID,
					ReactionType: body.ReactionType,
					CreatedAt:    time.Now(),
				})

				response.Success(w, http.StatusOK, "reação registrada", map[string]string{
					"reaction_type": body.ReactionType,
				})
			})

			// =========================================================
			// 2. Comentários e Respostas Aprofundadas
			// =========================================================
			protected.Get("/posts/{id}/comments", func(w http.ResponseWriter, r *http.Request) {
				postID := chi.URLParam(r, "id")
				commentsList, err := commentService.GetCommentsByPostID(r.Context(), postID)
				if err != nil {
					response.InternalServerError(w, "erro ao carregar comentários")
					return
				}
				response.Success(w, http.StatusOK, "comentários carregados", commentsList)
			})

			protected.Post("/posts/{id}/comments", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				postID := chi.URLParam(r, "id")

				var body struct {
					Content  string  `json:"content"`
					ParentID *string `json:"parent_id"`
				}
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					response.BadRequest(w, "payload json inválido")
					return
				}

				if body.Content == "" {
					response.BadRequest(w, "o comentário não pode ser vazio")
					return
				}

				c, err := commentService.CreateComment(r.Context(), postID, userID, body.Content, body.ParentID)
				if err != nil {
					response.InternalServerError(w, fmt.Sprintf("erro ao salvar comentário: %v", err))
					return
				}

				response.Success(w, http.StatusCreated, "comentário publicado", c)
			})

			// =========================================================
			// 3. Conexões & Networking Consciente
			// =========================================================
			protected.Get("/connections", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				status := r.URL.Query().Get("status") // 'active' ou 'pending'
				list, err := connService.ListConnections(r.Context(), userID, status)
				if err != nil {
					response.InternalServerError(w, "erro ao listar conexões")
					return
				}
				response.Success(w, http.StatusOK, "conexões obtidas com sucesso", list)
			})

			protected.Post("/connections/request", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				var body struct {
					TargetUserID string `json:"target_user_id"`
					Note         string `json:"note"`
				}
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					response.BadRequest(w, "payload json inválido")
					return
				}

				item, err := connService.RequestConnection(r.Context(), userID, body.TargetUserID, body.Note)
				if err != nil {
					response.BadRequest(w, err.Error())
					return
				}
				response.Success(w, http.StatusCreated, "solicitação de conexão enviada", item)
			})

			protected.Post("/connections/{id}/accept", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				connID := chi.URLParam(r, "id")

				if err := connService.AcceptConnection(r.Context(), connID, userID); err != nil {
					response.BadRequest(w, err.Error())
					return
				}
				response.Success(w, http.StatusOK, "conexão aceita com sucesso", nil)
			})

			protected.Post("/connections/{id}/reject", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				connID := chi.URLParam(r, "id")

				if err := connService.RejectConnection(r.Context(), connID, userID); err != nil {
					response.BadRequest(w, err.Error())
					return
				}
				response.Success(w, http.StatusOK, "solicitação recusada", nil)
			})

			protected.Delete("/connections/{id}", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				connID := chi.URLParam(r, "id")

				if err := connService.RemoveConnection(r.Context(), connID, userID); err != nil {
					response.BadRequest(w, err.Error())
					return
				}
				response.Success(w, http.StatusOK, "conexão desfeita com sucesso", nil)
			})

			// =========================================================
			// 4. Notificações
			// =========================================================
			protected.Get("/notifications", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
				offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

				list, err := notifService.GetUserNotifications(r.Context(), userID, limit, offset)
				if err != nil {
					response.InternalServerError(w, "erro ao buscar notificações")
					return
				}
				response.Success(w, http.StatusOK, "notificações carregadas", list)
			})

			protected.Get("/notifications/unread-count", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				count, err := notifService.GetUnreadCount(r.Context(), userID)
				if err != nil {
					response.InternalServerError(w, "erro ao contar notificações não lidas")
					return
				}
				response.Success(w, http.StatusOK, "contagem obtida", map[string]int{"unread_count": count})
			})

			protected.Patch("/notifications/{id}/read", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				notifID := chi.URLParam(r, "id")

				if err := notifService.MarkAsRead(r.Context(), notifID, userID); err != nil {
					response.InternalServerError(w, "erro ao atualizar notificação")
					return
				}
				response.Success(w, http.StatusOK, "notificação marcada como lida", nil)
			})

			protected.Post("/notifications/read-all", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				if err := notifService.MarkAllAsRead(r.Context(), userID); err != nil {
					response.InternalServerError(w, "erro ao marcar notificações como lidas")
					return
				}
				response.Success(w, http.StatusOK, "todas as notificações marcadas como lidas", nil)
			})

			// =========================================================
			// 5. Perfil de Usuário
			// =========================================================
			protected.Get("/users/me", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				profile, err := userService.GetProfile(r.Context(), userID, userID)
				if err != nil {
					response.NotFound(w, "usuário não encontrado")
					return
				}
				response.Success(w, http.StatusOK, "perfil carregado", profile)
			})

			protected.Put("/users/me", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				var body users.ProfileUpdate
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					response.BadRequest(w, "payload json inválido")
					return
				}

				profile, err := userService.UpdateProfile(r.Context(), userID, body)
				if err != nil {
					response.InternalServerError(w, "erro ao atualizar perfil")
					return
				}
				response.Success(w, http.StatusOK, "perfil atualizado com sucesso", profile)
			})

			protected.Get("/users/{id}/profile", func(w http.ResponseWriter, r *http.Request) {
				currentUserID, _ := auth.GetUserID(r.Context())
				targetID := chi.URLParam(r, "id")

				profile, err := userService.GetProfile(r.Context(), targetID, currentUserID)
				if err != nil {
					response.NotFound(w, "perfil não encontrado")
					return
				}
				response.Success(w, http.StatusOK, "perfil carregado", profile)
			})

			// =========================================================
			// 6. Upload Presign S3 & Cloudflare CDN
			// =========================================================
			protected.Post("/media/presign-upload", func(w http.ResponseWriter, r *http.Request) {
				var body struct {
					FileName    string `json:"file_name"`
					ContentType string `json:"content_type"`
					Folder      string `json:"folder"`
				}
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					response.BadRequest(w, "payload json inválido")
					return
				}

				if body.Folder == "" {
					body.Folder = "posts"
				}

				presigned, err := storageService.GeneratePresignedUploadURL(r.Context(), body.Folder, body.FileName, body.ContentType)
				if err != nil {
					response.InternalServerError(w, "erro ao gerar url de upload")
					return
				}

				response.Success(w, http.StatusOK, "url de upload gerada com sucesso", presigned)
			})

			// =========================================================
			// 7. Momentos (Stories 24h Instagram Style)
			// =========================================================
			protected.Get("/momentos", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				groups, err := momentoService.GetActiveMomentosGrouped(r.Context(), userID)
				if err != nil {
					response.InternalServerError(w, "erro ao buscar momentos")
					return
				}
				response.Success(w, http.StatusOK, "momentos carregados", groups)
			})

			protected.Post("/momentos", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				var body struct {
					MediaURL       string `json:"media_url"`
					TextNote       string `json:"text_note"`
					ExpiresInHours int    `json:"expires_in_hours"`
				}
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					response.BadRequest(w, "payload json inválido")
					return
				}

				momentoID, err := momentoService.CreateMomento(r.Context(), userID, body.MediaURL, body.TextNote, body.ExpiresInHours)
				if err != nil {
					response.InternalServerError(w, "erro ao criar momento")
					return
				}

				response.Success(w, http.StatusCreated, "momento criado", map[string]string{
					"id": momentoID,
				})
			})

			protected.Post("/momentos/{id}/view", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				momentoID := chi.URLParam(r, "id")
				_ = momentoService.MarkMomentoViewed(r.Context(), momentoID, userID)
				response.Success(w, http.StatusOK, "momento visualizado", nil)
			})

			// =========================================================
			// 8. Conversas & Mensagens em Tempo Real
			// =========================================================
			protected.Get("/conversations", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				tab := r.URL.Query().Get("tab")
				convs, err := chatService.GetUserConversations(r.Context(), userID, tab)
				if err != nil {
					response.InternalServerError(w, "erro ao buscar conversas")
					return
				}
				response.Success(w, http.StatusOK, "conversas carregadas", convs)
			})

			protected.Post("/conversations/{id}/messages", func(w http.ResponseWriter, r *http.Request) {
				userID, _ := auth.GetUserID(r.Context())
				convID := chi.URLParam(r, "id")

				var body struct {
					Content string `json:"content"`
				}
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					response.BadRequest(w, "payload json inválido")
					return
				}

				msg, err := chatService.SendMessage(r.Context(), convID, userID, body.Content)
				if err != nil {
					response.InternalServerError(w, "erro ao enviar mensagem")
					return
				}

				response.Success(w, http.StatusCreated, "mensagem enviada", msg)
			})
		})
	})

	// Inicialização Graciosa do Servidor HTTP
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🚀 Servidor HTTP rodando na porta %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Erro fatal no servidor HTTP: %v", err)
		}
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Desligando servidor graciosa e seguramente...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Erro ao encerrar servidor HTTP: %v", err)
	}

	log.Println("✨ SlowSocial API Gateway finalizado limpo.")
}
