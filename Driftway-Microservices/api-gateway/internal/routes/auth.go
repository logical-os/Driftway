package routes

import (
	"driftway-api-gateway/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupAuthRoutes(router *gin.RouterGroup, authService *services.AuthService) {
	router.POST("/register", handleRegister(authService))
	router.POST("/login", handleLogin(authService))
	router.POST("/refresh", handleRefresh(authService))
	router.GET("/me", handleMe(authService))
}

func handleRegister(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req services.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request data",
			})
			return
		}

		ipAddress := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")

		response, err := authService.Register(req, ipAddress, userAgent)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusCreated, response)
	}
}

func handleLogin(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req services.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request data",
			})
			return
		}

		ipAddress := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")

		response, err := authService.Login(req, ipAddress, userAgent)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, response)
	}
}

func handleRefresh(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Implementation for token refresh
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Token refresh not implemented yet",
		})
	}
}

func handleMe(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// This would typically require JWT middleware
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not authenticated",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"user": user,
		})
	}
}