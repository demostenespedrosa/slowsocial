package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/slowsocial/backend/internal/config"
	"github.com/slowsocial/backend/pkg/response"
)

type contextKey string

const (
	UserIDContextKey    contextKey = "user_id"
	UserEmailContextKey contextKey = "user_email"
	UserRoleContextKey  contextKey = "user_role"
)

type SupabaseClaims struct {
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

type AuthMiddleware struct {
	jwtSecret []byte
}

func NewAuthMiddleware(cfg *config.Config) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: []byte(cfg.SupabaseJWTSecret),
	}
}

// RequireAuth valida o JWT do Supabase e injeta o ID do usuário no contexto
func (a *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Unauthorized(w, "cabeçalho de autorização não fornecido")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.Unauthorized(w, "formato do token de autorização inválido (use Bearer <token>)")
			return
		}

		tokenStr := parts[1]
		claims := &SupabaseClaims{}

		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("método de assinatura inesperado")
			}
			return a.jwtSecret, nil
		})

		if err != nil || !token.Valid {
			response.Unauthorized(w, "token inválido ou expirado")
			return
		}

		ctx := context.WithValue(r.Context(), UserIDContextKey, claims.Subject)
		ctx = context.WithValue(ctx, UserEmailContextKey, claims.Email)
		ctx = context.WithValue(ctx, UserRoleContextKey, claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// OptionalAuth valida o token se presente, mas não bloqueia caso anônimo
func (a *AuthMiddleware) OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			claims := &SupabaseClaims{}
			token, err := jwt.ParseWithClaims(parts[1], claims, func(token *jwt.Token) (interface{}, error) {
				return a.jwtSecret, nil
			})
			if err == nil && token.Valid {
				ctx := context.WithValue(r.Context(), UserIDContextKey, claims.Subject)
				ctx = context.WithValue(ctx, UserEmailContextKey, claims.Email)
				r = r.WithContext(ctx)
			}
		}

		next.ServeHTTP(w, r)
	})
}

// GetUserID extrai o UserID do contexto da requisição
func GetUserID(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(UserIDContextKey).(string)
	return val, ok
}
