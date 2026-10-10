package connections_test

import (
	"context"
	"strings"
	"testing"

	"github.com/slowsocial/backend/internal/connections"
)

func TestConnectionValidation(t *testing.T) {
	service := connections.NewConnectionService(nil)

	t.Run("Cannot connect to self", func(t *testing.T) {
		_, err := service.RequestConnection(context.Background(), "user_1", "user_1", "Olá!")
		if err == nil {
			t.Fatal("esperava erro ao tentar se conectar a si mesmo")
		}
		if !strings.Contains(err.Error(), "não é possível se conectar a si mesmo") {
			t.Fatalf("mensagem inesperada: %v", err)
		}
	})

	t.Run("Cannot exceed 140 characters in connection note", func(t *testing.T) {
		longNote := strings.Repeat("A", 141)
		_, err := service.RequestConnection(context.Background(), "user_1", "user_2", longNote)
		if err == nil {
			t.Fatal("esperava erro ao exceder 140 caracteres na nota")
		}
		if !strings.Contains(err.Error(), "máximo 140 caracteres") {
			t.Fatalf("mensagem inesperada: %v", err)
		}
	})
}
