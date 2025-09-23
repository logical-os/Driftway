package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	Port        string
	Environment string
	LogLevel    string

	// Database
	MongoURI string
	RedisURL string

	// Security
	JWTSecret  string
	APISecret  string
	APIKeyHash string

	// Service URLs
	TextServiceURL  string
	VoiceServiceURL string

	// Rate limiting
	RateLimit RateLimitConfig

	// IP Whitelist
	WhitelistedIPs []string
}

type RateLimitConfig struct {
	Requests int
	Window   time.Duration
}

func Load() (*Config, error) {
	// Load .env file if it exists
	godotenv.Load()

	cfg := &Config{
		Port:        getEnv("API_PORT", "8080"),
		Environment: getEnv("NODE_ENV", "development"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),

		MongoURI: getEnv("MONGO_URI", "mongodb://localhost:27017/driftway"),
		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379"),

		JWTSecret:  getEnv("JWT_SECRET", "default-jwt-secret"),
		APISecret:  getEnv("API_SECRET", "default-api-secret"),
		APIKeyHash: getEnv("API_KEY_HASH", "default-api-key-hash"),

		TextServiceURL:  getEnv("TEXT_SERVICE_URL", "http://localhost:4000"),
		VoiceServiceURL: getEnv("VOICE_SERVICE_URL", "http://localhost:9090"),

		RateLimit: RateLimitConfig{
			Requests: getEnvInt("RATE_LIMIT_REQUESTS", 100),
			Window:   time.Duration(getEnvInt("RATE_LIMIT_WINDOW", 900)) * time.Second,
		},
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}