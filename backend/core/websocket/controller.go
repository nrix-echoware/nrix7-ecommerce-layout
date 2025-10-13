package websocket

import (
	"log"
	"net/http"
	"strings"
	"time"

	"ecommerce-backend/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// WebSocketController handles WebSocket related HTTP requests
type WebSocketController struct {
	hub           *Hub
	clientHandler *ClientHandler
}

// NewWebSocketController creates a new WebSocket controller
func NewWebSocketController(hub *Hub) *WebSocketController {
	return &WebSocketController{
		hub:           hub,
		clientHandler: NewClientHandler(hub),
	}
}

// ConnectWebSocket handles WebSocket connections
func (c *WebSocketController) ConnectWebSocket(ctx *gin.Context) {
	// Check if user is authenticated via JWT
	userEmail := c.getEmailFromJWT(ctx)
	isAdmin := c.isAdminUser(ctx)

	// Handle WebSocket connection
	c.clientHandler.HandleWebSocket(ctx.Writer, ctx.Request, userEmail, isAdmin)
}

// SendNotification handles admin notification requests
func (c *WebSocketController) SendNotification(ctx *gin.Context) {
	// Check if user is admin
	if !c.isAdminUser(ctx) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req AdminNotificationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create notification
	notification := &Notification{
		ID:        uuid.New(),
		Title:     req.Title,
		Message:   req.Message,
		Type:      req.Type,
		Target:    req.Target,
		CreatedAt: time.Now(),
		Read:      false,
	}

	// Send notification via WebSocket
	c.hub.SendNotification(notification)

	ctx.JSON(http.StatusOK, gin.H{
		"message":      "Notification sent successfully",
		"notification": notification,
	})
}

// GetConnectionStats returns current WebSocket connection statistics
func (c *WebSocketController) GetConnectionStats(ctx *gin.Context) {
	// Check if user is admin
	if !c.isAdminUser(ctx) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	stats := c.hub.GetConnectionStats()
	ctx.JSON(http.StatusOK, stats)
}

// getEmailFromJWT extracts email from JWT token
func (c *WebSocketController) getEmailFromJWT(ctx *gin.Context) string {
	authHeader := ctx.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}

	// Extract token from "Bearer <token>"
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return ""
	}

	// For now, we'll use a simple approach
	// In a real implementation, you'd validate the JWT and extract the email
	// This is a placeholder - the actual JWT validation should be done in the users module
	return ""
}

// isAdminUser checks if the current user is an admin
func (c *WebSocketController) isAdminUser(ctx *gin.Context) bool {
	// Check for admin API key
	adminKey := ctx.GetHeader("X-Admin-API-Key")
	expectedKey := config.Get().AdminAPIKey
	
	log.Printf("Admin key validation - Received: '%s', Expected: '%s'", adminKey, expectedKey)
	
	if adminKey != "" && adminKey == expectedKey {
		log.Printf("Admin key validation successful")
		return true
	}

	log.Printf("Admin key validation failed")
	// Check JWT for admin role (if you implement role-based auth)
	// For now, return false
	return false
}

// RegisterRoutes registers WebSocket routes
func (c *WebSocketController) RegisterRoutes(r *gin.Engine) {
	// WebSocket connection endpoint
	r.GET("/ws", c.ConnectWebSocket)
	
	// Admin endpoints
	admin := r.Group("/admin/ws")
	admin.Use(adminKeyMiddleware())
	{
		admin.POST("/notify", c.SendNotification)
		admin.GET("/stats", c.GetConnectionStats)
	}
}

// adminKeyMiddleware validates admin API key
func adminKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		expected := config.Get().AdminAPIKey
		provided := c.GetHeader("X-Admin-API-Key")
		
		if provided == "" || provided != expected {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid admin API key"})
			c.Abort()
			return
		}
		
		c.Next()
	}
}
