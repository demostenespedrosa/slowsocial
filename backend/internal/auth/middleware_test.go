package auth_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/slowsocial/backend/internal/auth"
	"github.com/slowsocial/backend/internal/config"
)

func TestAuthMiddleware(t *testing.T) {
	jwtSecret := "my-test-secret-key-32-bytes-long"
	cfg := &config.Config{
		SupabaseJWTSecret: jwtSecret,
	}
	middleware := auth.NewAuthMiddleware(cfg)

	handler := middleware.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r.Context())
		if !ok || userID == "" {
			t.Errorf("expected valid userID in context")
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok:" + userID))
	}))

	t.Run("Missing Authorization Header", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/feed", nil)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status 401, got %d", rec.Code)
		}
	})

	t.Run("Invalid Header Format", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/feed", nil)
		req.Header.Set("Authorization", "Token abcxyz")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status 401, got %d", rec.Code)
		}
	})

	t.Run("Valid JWT Token", func(t *testing.T) {
		claims := &auth.SupabaseClaims{
			Email: "demostenes@slowsocial.app",
			Role:  "authenticated",
			RegisteredClaims: jwt.RegisteredClaims{
				Subject:   "usr_demostenes",
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
			},
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signedToken, err := token.SignedString([]byte(jwtSecret))
		if err != nil {
			t.Fatalf("failed to sign test token: %v", err)
		}

		req := httptest.NewRequest("GET", "/api/v1/feed", nil)
		req.Header.Set("Authorization", "Bearer "+signedToken)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}

		if rec.Body.String() != "ok:usr_demostenes" {
			t.Fatalf("expected response 'ok:usr_demostenes', got '%s'", rec.Body.String())
		}
	})

	t.Run("Expired JWT Token", func(t *testing.T) {
		claims := &auth.SupabaseClaims{
			Email: "demostenes@slowsocial.app",
			Role:  "authenticated",
			RegisteredClaims: jwt.RegisteredClaims{
				Subject:   "usr_demostenes",
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
			},
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signedToken, err := token.SignedString([]byte(jwtSecret))
		if err != nil {
			t.Fatalf("failed to sign test token: %v", err)
		}

		req := httptest.NewRequest("GET", "/api/v1/feed", nil)
		req.Header.Set("Authorization", "Bearer "+signedToken)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status 401 for expired token, got %d", rec.Code)
		}
	})
}
