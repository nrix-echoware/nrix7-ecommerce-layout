package audiocontact

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"nrix7-ecommerce-layout/backend/internal/config"
)

type AudioContactController struct {
	service AudioContactService
}

func NewAudioContactController(service AudioContactService) *AudioContactController {
	return &AudioContactController{
		service: service,
	}
}

// SubmitAudioContact handles audio contact submissions
func (c *AudioContactController) SubmitAudioContact(ctx *gin.Context) {
	// Check payload size limit
	cfg := config.Get()
	maxSizeBytes := int64(cfg.AudioStorage.MaxPayloadSizeMB) * 1024 * 1024
	
	if ctx.Request.ContentLength > maxSizeBytes {
		ctx.JSON(http.StatusRequestEntityTooLarge, gin.H{
			"error": "Payload size exceeds maximum allowed size",
			"max_size_mb": cfg.AudioStorage.MaxPayloadSizeMB,
		})
		return
	}

	var req AudioContactRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user ID from context if available (from auth middleware)
	userID, exists := ctx.Get("user_id")
	var userIDPtr *uint
	if exists {
		if uid, ok := userID.(uint); ok {
			userIDPtr = &uid
		}
	}

	response, err := c.service.CreateAudioContact(&req, userIDPtr)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to submit audio contact",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, response)
}

// GetAudioContact gets a specific audio contact by ID
func (c *AudioContactController) GetAudioContact(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid audio contact ID",
		})
		return
	}

	audioContact, err := c.service.GetAudioContact(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Audio contact not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, audioContact)
}

// GetAllAudioContacts gets all audio contacts (admin only)
func (c *AudioContactController) GetAllAudioContacts(ctx *gin.Context) {
	limitStr := ctx.DefaultQuery("limit", "20")
	offsetStr := ctx.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	audioContacts, err := c.service.GetAllAudioContacts(limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve audio contacts",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": audioContacts,
		"limit": limit,
		"offset": offset,
	})
}

// GetAudioContactsByStatus gets audio contacts by status (admin only)
func (c *AudioContactController) GetAudioContactsByStatus(ctx *gin.Context) {
	status := ctx.Param("status")
	if status == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Status parameter is required",
		})
		return
	}

	limitStr := ctx.DefaultQuery("limit", "20")
	offsetStr := ctx.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	audioContacts, err := c.service.GetAudioContactsByStatus(status, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve audio contacts",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": audioContacts,
		"status": status,
		"limit": limit,
		"offset": offset,
	})
}

// UpdateAudioContactStatus updates the status of an audio contact (admin only)
func (c *AudioContactController) UpdateAudioContactStatus(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid audio contact ID",
		})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
		Notes  string `json:"notes"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Validate status
	validStatuses := []string{"pending", "processed", "archived"}
	if !contains(validStatuses, req.Status) {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid status. Must be one of: pending, processed, archived",
		})
		return
	}

	err = c.service.UpdateAudioContactStatus(uint(id), req.Status, req.Notes)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update audio contact status",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Audio contact status updated successfully",
	})
}

// DeleteAudioContact deletes an audio contact (admin only)
func (c *AudioContactController) DeleteAudioContact(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid audio contact ID",
		})
		return
	}

	err = c.service.DeleteAudioContact(uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete audio contact",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Audio contact deleted successfully",
	})
}

// GetAudioFile serves the audio file
func (c *AudioContactController) GetAudioFile(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid audio contact ID",
		})
		return
	}

	audioContact, err := c.service.GetAudioContact(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Audio contact not found",
		})
		return
	}

	audioData, err := c.service.GetAudioFile(audioContact)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve audio file",
		})
		return
	}

	// Set appropriate headers
	ctx.Header("Content-Type", audioContact.MimeType)
	ctx.Header("Content-Length", strconv.Itoa(len(audioData)))
	ctx.Header("Content-Disposition", "inline; filename=\""+audioContact.AudioFile+"\"")

	ctx.Data(http.StatusOK, audioContact.MimeType, audioData)
}

// GetStats gets audio contact statistics (admin only)
func (c *AudioContactController) GetStats(ctx *gin.Context) {
	stats, err := c.service.GetStats()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve statistics",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

// RegisterRoutes registers all audio contact routes
func (c *AudioContactController) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// Public routes (no auth required)
		api.POST("/audio-contact", c.SubmitAudioContact)
		api.GET("/audio/:id", c.GetAudioFile)
		
		// Admin routes (require admin API key)
		admin := api.Group("/admin")
		admin.Use(c.adminAuthMiddleware())
		{
			admin.GET("/audio-contacts", c.GetAllAudioContacts)
			admin.GET("/audio-contacts/status/:status", c.GetAudioContactsByStatus)
			admin.GET("/audio-contacts/:id", c.GetAudioContact)
			admin.PUT("/audio-contacts/:id/status", c.UpdateAudioContactStatus)
			admin.DELETE("/audio-contacts/:id", c.DeleteAudioContact)
			admin.GET("/audio-contacts/stats", c.GetStats)
		}
	}
}

// adminAuthMiddleware checks for admin API key
func (c *AudioContactController) adminAuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		apiKey := ctx.GetHeader("X-Admin-API-Key")
		if apiKey == "" {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error": "Admin API key required",
			})
			ctx.Abort()
			return
		}
		
		// You can add proper API key validation here
		// For now, we'll just check if it's not empty
		ctx.Next()
	}
}

// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
