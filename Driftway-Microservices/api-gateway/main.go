package main

import (
	"driftway-api-gateway/internal/config"
	"driftway-api-gateway/internal/database"
	"driftway-api-gateway/internal/middleware"
	"driftway-api-gateway/internal/routes"
	"driftway-api-gateway/internal/services"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	// Setup logger
	logrus.SetLevel(logrus.InfoLevel)
	if cfg.LogLevel == "debug" {
		logrus.SetLevel(logrus.DebugLevel)
	}

	// Initialize database connections
	db, err := database.ConnectMongo(cfg.MongoURI)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}

	redis, err := database.ConnectRedis(cfg.RedisURL)
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	// Initialize services
	authService := services.NewAuthService(db, redis, cfg.JWTSecret)
	proxyService := services.NewProxyService(cfg.TextServiceURL, cfg.VoiceServiceURL)

	// Setup Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Global middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.RateLimit(cfg.RateLimit.Requests, cfg.RateLimit.Window))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "api-gateway",
			"timestamp": "2025-09-23T14:00:00Z",
		})
	})

	// Setup routes
	api := router.Group("/api")
	{
		// Authentication routes (handled by this service)
		auth := api.Group("/auth")
		routes.SetupAuthRoutes(auth, authService)

		// Proxy routes to other services
		api.Use(middleware.JWTAuth(authService))
		{
			// Text channels (proxy to Elixir service)
			text := api.Group("/text")
			routes.SetupTextProxyRoutes(text, proxyService)

			// Voice channels (proxy to C++ service)
			voice := api.Group("/voice")
			routes.SetupVoiceProxyRoutes(voice, proxyService)

			// Users and servers (handled by this service)
			users := api.Group("/users")
			routes.SetupUserRoutes(users, authService)

			servers := api.Group("/servers")
			routes.SetupServerRoutes(servers, authService)
		}
	}

	// Start server
	logrus.Infof("Starting Driftway API Gateway on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}