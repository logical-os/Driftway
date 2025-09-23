package routes

import (
	"driftway-api-gateway/internal/services"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupTextProxyRoutes(router *gin.RouterGroup, proxyService *services.ProxyService) {
	// Channels
	router.GET("/channels", proxyTextRequest(proxyService))
	router.POST("/channels", proxyTextRequest(proxyService))
	router.GET("/channels/:id", proxyTextRequest(proxyService))
	router.PUT("/channels/:id", proxyTextRequest(proxyService))
	router.DELETE("/channels/:id", proxyTextRequest(proxyService))

	// Messages
	router.GET("/channels/:id/messages", proxyTextRequest(proxyService))
	router.POST("/channels/:id/messages", proxyTextRequest(proxyService))
	router.PUT("/messages/:id", proxyTextRequest(proxyService))
	router.DELETE("/messages/:id", proxyTextRequest(proxyService))

	// WebSocket endpoint (special handling)
	router.GET("/channels/:id/socket", handleTextWebSocket(proxyService))
}

func SetupVoiceProxyRoutes(router *gin.RouterGroup, proxyService *services.ProxyService) {
	// Voice channels
	router.POST("/join/:channelId", proxyVoiceRequest(proxyService))
	router.DELETE("/leave/:channelId", proxyVoiceRequest(proxyService))
	router.GET("/participants/:channelId", proxyVoiceRequest(proxyService))

	// WebRTC signaling
	router.POST("/offer", proxyVoiceRequest(proxyService))
	router.POST("/answer", proxyVoiceRequest(proxyService))
	router.POST("/ice-candidate", proxyVoiceRequest(proxyService))

	// Voice WebSocket endpoint
	router.GET("/channels/:id/voice", handleVoiceWebSocket(proxyService))
}

func SetupUserRoutes(router *gin.RouterGroup, authService *services.AuthService) {
	router.GET("/profile", handleUserProfile(authService))
	router.PUT("/profile", handleUpdateProfile(authService))
	router.GET("/friends", handleGetFriends(authService))
	router.POST("/friends", handleAddFriend(authService))
}

func SetupServerRoutes(router *gin.RouterGroup, authService *services.AuthService) {
	router.GET("/", handleGetServers(authService))
	router.POST("/", handleCreateServer(authService))
	router.GET("/:id", handleGetServer(authService))
	router.PUT("/:id", handleUpdateServer(authService))
	router.DELETE("/:id", handleDeleteServer(authService))
	router.POST("/:id/join", handleJoinServer(authService))
	router.POST("/:id/leave", handleLeaveServer(authService))
}

// Text service proxy functions
func proxyTextRequest(proxyService *services.ProxyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read request body
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read request body",
			})
			return
		}

		// Prepare headers
		headers := make(map[string]string)
		for key, values := range c.Request.Header {
			if len(values) > 0 {
				headers[key] = values[0]
			}
		}

		// Add user information from JWT
		if userID, exists := c.Get("userID"); exists {
			headers["X-User-ID"] = userID.(string)
		}

		// Proxy request
		resp, err := proxyService.ProxyToTextService(c.Request.Method, c.Request.URL.Path, body, headers)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "Text service unavailable",
			})
			return
		}
		defer resp.Body.Close()

		// Copy response headers
		for key, values := range resp.Header {
			for _, value := range values {
				c.Header(key, value)
			}
		}

		// Copy response body
		c.Status(resp.StatusCode)
		io.Copy(c.Writer, resp.Body)
	}
}

// Voice service proxy functions
func proxyVoiceRequest(proxyService *services.ProxyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read request body
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read request body",
			})
			return
		}

		// Prepare headers
		headers := make(map[string]string)
		for key, values := range c.Request.Header {
			if len(values) > 0 {
				headers[key] = values[0]
			}
		}

		// Add user information from JWT
		if userID, exists := c.Get("userID"); exists {
			headers["X-User-ID"] = userID.(string)
		}

		// Proxy request
		resp, err := proxyService.ProxyToVoiceService(c.Request.Method, c.Request.URL.Path, body, headers)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "Voice service unavailable",
			})
			return
		}
		defer resp.Body.Close()

		// Copy response headers
		for key, values := range resp.Header {
			for _, value := range values {
				c.Header(key, value)
			}
		}

		// Copy response body
		c.Status(resp.StatusCode)
		io.Copy(c.Writer, resp.Body)
	}
}

// WebSocket handlers (simplified - would need proper WebSocket proxying)
func handleTextWebSocket(proxyService *services.ProxyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error":   "WebSocket proxying not implemented",
			"message": "Connect directly to text service for WebSocket",
			"url":     proxyService.GetTextServiceWebSocketURL(c.Request.URL.Path),
		})
	}
}

func handleVoiceWebSocket(proxyService *services.ProxyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error":   "WebSocket proxying not implemented",
			"message": "Connect directly to voice service for WebSocket",
			"url":     proxyService.GetVoiceServiceWebSocketURL(c.Request.URL.Path),
		})
	}
}

// User management handlers (handled by this service)
func handleUserProfile(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"user": user})
	}
}

func handleUpdateProfile(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Profile update not implemented yet",
		})
	}
}

func handleGetFriends(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Friends system not implemented yet",
		})
	}
}

func handleAddFriend(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Add friend not implemented yet",
		})
	}
}

// Server management handlers (handled by this service)
func handleGetServers(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Server listing not implemented yet",
		})
	}
}

func handleCreateServer(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Server creation not implemented yet",
		})
	}
}

func handleGetServer(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Server details not implemented yet",
		})
	}
}

func handleUpdateServer(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Server update not implemented yet",
		})
	}
}

func handleDeleteServer(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Server deletion not implemented yet",
		})
	}
}

func handleJoinServer(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Server join not implemented yet",
		})
	}
}

func handleLeaveServer(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{
			"error": "Server leave not implemented yet",
		})
	}
}