package config_test

import (
	"os"
	"testing"

	"github.com/slowsocial/backend/internal/config"
)

func TestConfigDefaultValues(t *testing.T) {
	// Limpar variáveis de ambiente temporárias para teste
	os.Unsetenv("PORT")
	os.Unsetenv("ENVIRONMENT")

	cfg := config.Load()

	if cfg.Port != "8080" {
		t.Errorf("expected default Port '8080', got '%s'", cfg.Port)
	}

	if cfg.Environment != "development" {
		t.Errorf("expected default Environment 'development', got '%s'", cfg.Environment)
	}

	if cfg.DBMaxConns != 25 {
		t.Errorf("expected default DBMaxConns 25, got %d", cfg.DBMaxConns)
	}
}

func TestConfigCustomEnvValues(t *testing.T) {
	os.Setenv("PORT", "9090")
	os.Setenv("ENVIRONMENT", "staging")
	os.Setenv("DB_MAX_CONNS", "50")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("ENVIRONMENT")
		os.Unsetenv("DB_MAX_CONNS")
	}()

	cfg := config.Load()

	if cfg.Port != "9090" {
		t.Errorf("expected Port '9090', got '%s'", cfg.Port)
	}

	if cfg.Environment != "staging" {
		t.Errorf("expected Environment 'staging', got '%s'", cfg.Environment)
	}

	if cfg.DBMaxConns != 50 {
		t.Errorf("expected DBMaxConns 50, got %d", cfg.DBMaxConns)
	}
}
