package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	// Servidor
	Port           string
	Environment    string
	AllowedOrigins []string

	// Banco de Dados PostgreSQL
	DatabaseURL string
	DBMaxConns  int32
	DBMinConns  int32

	// Cache Redis
	RedisAddr     string
	RedisPassword string
	RedisDB       int

	// Apache Kafka
	KafkaBrokers       []string
	KafkaConsumerGroup string

	// Supabase Auth
	SupabaseJWTSecret string
	SupabaseURL       string

	// Object Storage S3 & Cloudflare CDN
	S3Endpoint  string
	S3Bucket    string
	S3AccessKey string
	S3SecretKey string
	S3Region    string
	CDNBaseURL  string

	// OpenTelemetry
	OTelEndpoint string
}

func Load() *Config {
	return &Config{
		Port:           getEnv("PORT", "8080"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		AllowedOrigins: strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:8080"), ","),

		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/slowsocial?sslmode=disable"),
		DBMaxConns:  int32(getEnvAsInt("DB_MAX_CONNS", 25)),
		DBMinConns:  int32(getEnvAsInt("DB_MIN_CONNS", 5)),

		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", "redis_password"),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		KafkaBrokers:       strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ","),
		KafkaConsumerGroup: getEnv("KAFKA_CONSUMER_GROUP", "slowsocial-group"),

		SupabaseJWTSecret: getEnv("SUPABASE_JWT_SECRET", "super-secret-supabase-jwt-key"),
		SupabaseURL:       getEnv("SUPABASE_URL", "https://your-project.supabase.co"),

		S3Endpoint:  getEnv("S3_ENDPOINT", "http://localhost:9000"),
		S3Bucket:    getEnv("S3_BUCKET", "slowsocial-media"),
		S3AccessKey: getEnv("S3_ACCESS_KEY", "minioadmin"),
		S3SecretKey: getEnv("S3_SECRET_KEY", "minioadmin"),
		S3Region:    getEnv("S3_REGION", "us-east-1"),
		CDNBaseURL:  getEnv("CDN_BASE_URL", "http://localhost:9000/slowsocial-media"),

		OTelEndpoint: getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317"),
	}
}

func getEnv(key, defaultVal string) string {
	if val, exists := os.LookupEnv(key); exists && strings.TrimSpace(val) != "" {
		return val
	}
	return defaultVal
}

func getEnvAsInt(key string, defaultVal int) int {
	valStr := getEnv(key, "")
	if val, err := strconv.Atoi(valStr); err == nil {
		return val
	}
	return defaultVal
}
