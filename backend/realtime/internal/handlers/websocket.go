package handlers

import (
	"net/http"
	"strings"
	"time"

	"ecommerce-realtime/internal/hub"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type WSHandler struct {
	wsHub    *hub.WSHub
	authMW   *AuthMiddleware
	adminKey string
}

func NewWSHandler(wsHub *hub.WSHub, authMW *AuthMiddleware, adminKey string) *WSHandler {
	return &WSHandler{
		wsHub:    wsHub,
		authMW:   authMW,
		adminKey: adminKey,
	}
}

func (h *WSHandler) ConnectWebSocket(c *gin.Context) {
	userEmail := ""
	userID := ""
	isAdmin := false

	adminKey := c.GetHeader("X-Admin-API-Key")
	if adminKey != "" && adminKey == h.adminKey {
		isAdmin = true
	} else if h.authMW != nil {
		// Extract token from header or query for WebSocket
		var token string
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			}
		}
		if token == "" {
			token = c.Query("token")
		}

		if token != "" {
			// Validate token using auth service
			claims, err := h.authMW.GetAuthService().ValidateToken(c.Request.Context(), token)
			if err == nil && claims != nil {
				userID = claims.UserID.String()
				userEmail = claims.Email
			}
		}
		// Note: If no token provided or invalid, connection will be anonymous
	}

	conn, err := hub.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to upgrade connection"})
		return
	}

	clientID := uuid.New().String()
	if userID != "" {
		clientID = userID
	} else if userEmail != "" {
		clientID = userEmail
	}

	sessionID := ""
	if userID == "" && userEmail == "" {
		sessionID = uuid.New().String()
	}

	client := &hub.WSClient{
		ID:        clientID,
		UserID:    userID,
		Email:     userEmail,
		SessionID: sessionID,
		IsAdmin:   isAdmin,
		Conn:      conn,
		Send:      make(chan []byte, 256),
		LastSeen:  time.Now(),
		Hub:       h.wsHub,
	}

	h.wsHub.Register <- client

	go client.ReadPump()
	go client.WritePump()
}

func (h *WSHandler) SendNotification(c *gin.Context) {
	adminKey := c.GetHeader("X-Admin-API-Key")
	if adminKey == "" || adminKey != h.adminKey {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req struct {
		Title   string `json:"title" binding:"required"`
		Message string `json:"message" binding:"required"`
		Type    string `json:"type" binding:"required,oneof=info success warning error"`
		Target  string `json:"target" binding:"required,oneof=all admin"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg := hub.WSMessage{
		Type:      "notification",
		Data:      req,
		Timestamp: time.Now(),
		From:      "admin",
	}

	if req.Target == "admin" {
		h.wsHub.SendToAdmin(msg)
	} else {
		h.wsHub.Broadcast(msg)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notification sent successfully",
		"notification": req,
	})
}

func (h *WSHandler) GetConnectionStats(c *gin.Context) {
	adminKey := c.GetHeader("X-Admin-API-Key")
	if adminKey == "" || adminKey != h.adminKey {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	stats := h.wsHub.GetConnectionStats()
	c.JSON(http.StatusOK, stats)
}

func (h *WSHandler) GetConnectionStatsInternal() interface{} {
	return h.wsHub.GetConnectionStats()
}

func (h *WSHandler) RegisterRoutes(r *gin.RouterGroup) {
	wsGroup := r.Group("/ws")
	if h.authMW != nil {
		// Optional auth - connection will work with or without token
		// Token is extracted in ConnectWebSocket if provided
	}
	wsGroup.GET("", h.ConnectWebSocket)

	adminRoutes := r.Group("/admin/ws")
	adminRoutes.Use(func(c *gin.Context) {
		adminKey := c.GetHeader("X-Admin-API-Key")
		if adminKey == "" {
			adminKey = c.Query("admin_key")
		}
		if adminKey != h.adminKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}
		c.Next()
	})
	{
		adminRoutes.POST("/notify", h.SendNotification)
		adminRoutes.GET("/stats", h.GetConnectionStats)
	}
}

