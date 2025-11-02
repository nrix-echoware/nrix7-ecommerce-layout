package chat

import (
	"context"
	"io"
	"net/http"
	"strconv"

	"ecommerce-backend/common/middleware"
	"ecommerce-backend/core/orders"
	"ecommerce-backend/core/users"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ChatController struct {
	threadService ThreadService
	messageService MessageService
	orderRepo     orders.OrderRepository
	userRepo      users.UserRepository
	authMW        gin.HandlerFunc
	sseHub        *SSEHub
}

func NewChatController(ts ThreadService, ms MessageService, or orders.OrderRepository, ur users.UserRepository, authMW gin.HandlerFunc, sseHub *SSEHub) *ChatController {
	return &ChatController{
		threadService: ts,
		messageService: ms,
		orderRepo:     or,
		userRepo:      ur,
		authMW:        authMW,
		sseHub:        sseHub,
	}
}

func (ctrl *ChatController) RegisterRoutes(r *gin.Engine) {
	adminRoutes := r.Group("/admin")
	adminRoutes.Use(middleware.AdminKeyMiddleware())
	{
		adminRoutes.GET("/sse", ctrl.AdminSSE)
		adminRoutes.GET("/threads/:order_id", ctrl.GetThreadByOrderID)
		adminRoutes.POST("/threads/:thread_id/close", ctrl.CloseThread)
		adminRoutes.GET("/messages/:thread_id", ctrl.GetMessages)
		adminRoutes.POST("/messages", ctrl.CreateMessage)
	}

	userRoutes := r.Group("/user")
	if ctrl.authMW != nil {
		userRoutes.Use(ctrl.authMW)
	}
	{
		userRoutes.GET("/sse/notification/:user_id", ctrl.UserSSE)
		userRoutes.GET("/threads/:order_id", ctrl.GetThreadByOrderIDUser)
		userRoutes.GET("/messages/:thread_id", ctrl.GetMessages)
		userRoutes.POST("/messages", ctrl.CreateMessage)
	}
}

func (ctrl *ChatController) AdminSSE(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	clientChan := make(chan []byte, 256)
	ctrl.sseHub.RegisterAdmin(clientChan)
	defer ctrl.sseHub.UnregisterAdmin(clientChan)

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

func (ctrl *ChatController) UserSSE(c *gin.Context) {
	userIDParam := c.Param("user_id")
	userIDVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	
	userUUID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	
	if userUUID.String() != userIDParam {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	clientChan := make(chan []byte, 256)
	ctrl.sseHub.RegisterUser(userIDParam, clientChan)
	defer ctrl.sseHub.UnregisterUser(userIDParam, clientChan)

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

func (ctrl *ChatController) GetThreadByOrderID(c *gin.Context) {
	orderID := c.Param("order_id")
	thread, err := ctrl.threadService.GetThreadByOrderID(context.Background(), orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
		return
	}
	c.JSON(http.StatusOK, thread)
}

func (ctrl *ChatController) GetThreadByOrderIDUser(c *gin.Context) {
	orderID := c.Param("order_id")
	userIDVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	
	userUUID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	
	order, err := ctrl.orderRepo.GetByIDAndUser(context.Background(), orderID, userUUID.String())
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "order not found"})
		return
	}
	
	thread, err := ctrl.threadService.GetThreadByOrderID(context.Background(), order.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
		return
	}
	c.JSON(http.StatusOK, thread)
}

func (ctrl *ChatController) CloseThread(c *gin.Context) {
	threadID := c.Param("thread_id")
	if err := ctrl.threadService.CloseThread(context.Background(), threadID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "thread closed"})
}

type createMessageRequest struct {
	ThreadID      string `json:"thread_id" binding:"required"`
	MessageContent string `json:"message_content"`
	Owner         string `json:"owner" binding:"required"`
}

func (ctrl *ChatController) CreateMessage(c *gin.Context) {
	isAdminRoute := c.Request.URL.Path[:6] == "/admin"
	
	var req createMessageRequest
	var mediaData []byte
	
	contentType := c.GetHeader("Content-Type")
	if len(contentType) >= 19 && contentType[:19] == "multipart/form-data" {
		err := c.Request.ParseMultipartForm(10 << 20)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse multipart form"})
			return
		}
		
		req.ThreadID = c.PostForm("thread_id")
		req.MessageContent = c.PostForm("message_content")
		req.Owner = c.PostForm("owner")
		
		if file, header, err := c.Request.FormFile("media"); err == nil {
			defer file.Close()
			if header.Size > 5*1024*1024 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "file too large, max 5MB"})
				return
			}
			
			mimeType := header.Header.Get("Content-Type")
			allowedTypes := map[string]bool{
				"image/jpeg":      true,
				"image/jpg":       true,
				"image/png":       true,
				"image/gif":       true,
				"image/webp":      true,
				"image/bmp":       true,
				"image/svg+xml":   true,
			}
			if mimeType == "" || !allowedTypes[mimeType] {
				c.JSON(http.StatusBadRequest, gin.H{"error": "only image files are allowed (jpeg, jpg, png, gif, webp, bmp, svg)"})
				return
			}
			
			mediaData, _ = io.ReadAll(file)
		}
	} else {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	var owner MessageOwner
	
	if isAdminRoute {
		if req.Owner != "admin" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "admin can only send as admin"})
			return
		}
		owner = OwnerAdmin
	} else {
		userIDVal, ok := c.Get("user_id")
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		
		userUUID, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
			return
		}
		
		if req.Owner != "user" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user can only send as user"})
			return
		}
		
		thread, err := ctrl.threadService.GetThreadByID(context.Background(), req.ThreadID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
			return
		}
		
		order, err := ctrl.orderRepo.GetByIDAndUser(context.Background(), thread.OrderID, userUUID.String())
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}
		_ = order
		
		owner = OwnerUser
	}

	if req.ThreadID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "thread_id is required"})
		return
	}

	message, err := ctrl.messageService.CreateMessage(
		context.Background(),
		req.ThreadID,
		req.MessageContent,
		mediaData,
		owner,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	result := map[string]interface{}{
		"message_id":      message.MessageID,
		"thread_id":        message.ThreadID,
		"message_content":  message.MessageContent,
		"owner":            message.Owner,
		"created_at":       message.CreatedAt,
		"has_media":         len(message.MediaData) > 0,
	}
	
	c.JSON(http.StatusOK, result)
}

func (ctrl *ChatController) GetMessages(c *gin.Context) {
	threadID := c.Param("thread_id")
	
	thread, err := ctrl.threadService.GetThreadByID(context.Background(), threadID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
		return
	}
	
	isAdminRoute := c.Request.URL.Path[:6] == "/admin"
	if !isAdminRoute {
		userIDVal, ok := c.Get("user_id")
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		
		userUUID, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
			return
		}
		
		order, err := ctrl.orderRepo.GetByIDAndUser(context.Background(), thread.OrderID, userUUID.String())
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}
		_ = order
	}
	
	skip, _ := strconv.Atoi(c.DefaultQuery("skip", "0"))
	take, _ := strconv.Atoi(c.DefaultQuery("take", "50"))
	
	messages, count, err := ctrl.messageService.GetMessagesByThread(context.Background(), threadID, skip, take)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	results := make([]map[string]interface{}, len(messages))
	for i, msg := range messages {
		results[i] = map[string]interface{}{
			"message_id":      msg.MessageID,
			"thread_id":       msg.ThreadID,
			"message_content": msg.MessageContent,
			"owner":           msg.Owner,
			"created_at":      msg.CreatedAt,
			"has_media":        len(msg.MediaData) > 0,
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"messages": results,
		"total":    count,
		"skip":     skip,
		"take":     take,
	})
}

