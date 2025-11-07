package handlers

import (
	"io"
	"net/http"

	"ecommerce-realtime/internal/hub"
	"github.com/gin-gonic/gin"
)

type SSEHandler struct {
	sseHub       *hub.SSEHub
	authMW       *AuthMiddleware
	adminKey     string
}

func NewSSEHandler(sseHub *hub.SSEHub, authMW *AuthMiddleware, adminKey string) *SSEHandler {
	return &SSEHandler{
		sseHub:   sseHub,
		authMW:   authMW,
		adminKey: adminKey,
	}
}

func (h *SSEHandler) AdminSSE(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	clientChan := make(chan []byte, 256)
	h.sseHub.RegisterAdmin(clientChan)
	defer h.sseHub.UnregisterAdmin(clientChan)

	c.Stream(func(w io.Writer) bool {
		select {
		case msg := <-clientChan:
			c.SSEvent("message", string(msg))
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

func (h *SSEHandler) UserSSE(c *gin.Context) {
	userIDParam := c.Param("user_id")
	if !ValidateUserID(c, userIDParam) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	clientChan := make(chan []byte, 256)
	h.sseHub.RegisterUser(userIDParam, clientChan)
	defer h.sseHub.UnregisterUser(userIDParam, clientChan)

	c.Stream(func(w io.Writer) bool {
		select {
		case msg := <-clientChan:
			c.SSEvent("message", string(msg))
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

func (h *SSEHandler) RegisterRoutes(r *gin.RouterGroup) {
	adminRoutes := r.Group("/admin")
	adminRoutes.Use(AdminKeyMiddleware(h.adminKey))
	{
		adminRoutes.GET("/sse", h.AdminSSE)
	}

	userRoutes := r.Group("/user")
	userRoutes.Use(h.authMW.Handler())
	{
		userRoutes.GET("/sse/notification/:user_id", h.UserSSE)
	}
}

