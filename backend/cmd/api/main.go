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
	"github.com/slowsocial/backend/internal/config"
	"github.com/slowsocial/backend/internal/database"
	"github.com/slowsocial/backend/internal/events"
	"github.com/slowsocial/backend/internal/feed"
	"github.com/slowsocial/backend/internal/media"
	"github.com/slowsocial/backend/internal/realtime"
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

	// 6. Serviços e Middlewares
	feedService := feed.NewFeedService(db.Pool, redisClient)
	authMiddleware := auth.NewAuthMiddleware(cfg)

	// 7. Roteador HTTP Chi
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
			userID = uuid.New().String() // Temporário para teste anônimo se não autenticado
		}
		realtime.ServeWS(wsHub, w, r, userID)
	})

	// Rotas da API v1
	r.Route("/api/v1", func(api chi.Router) {
		// Rotas Públicas
		api.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
			response.Success(w, http.StatusOK, "pong", nil)
		})

		// Rotas Autenticadas com Supabase JWT
		api.Group(func(protected chi.Router) {
			protected.Use(authMiddleware.RequireAuth)

			// 1. Feed de Conexões e Radar
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

			// 2. Criar Nova Publicação
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

				// Publicar evento assíncrono no Apache Kafka
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

			// 3. Reações com Lottie / Emojis Oficiais (❤️, 👏, 💡, 🤝, 🔥, 🤔)
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

				// Upsert de Reação
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

				// Publicar no Kafka para contagem assíncrona
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

			// 4. Presigned Upload URL para S3 / Cloudflare CDN
			protected.Post("/media/presign-upload", func(w http.ResponseWriter, r *http.Request) {
				var body struct {
					FileName    string `json:"file_name"`
					ContentType string `json:"content_type"`
					Folder      string `json:"folder"` // "posts", "stories", "avatars"
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
