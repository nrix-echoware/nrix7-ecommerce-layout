package contactus

import (
	"context"
	"ecommerce-backend/common/middleware"
	"encoding/json"
	"net"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
)

type ContactUsController struct {
	service     ContactUsService
	validator   *validator.Validate
	rateLimiter *contactRateLimiter
}

// Custom rate limiter for contact us: 50 requests per day per IP+Site
type contactRateLimiter struct {
	mu       sync.Mutex
	attempts map[string]*attemptTracker
}

type attemptTracker struct {
	count     int
	lastReset time.Time
}

func newContactRateLimiter() *contactRateLimiter {
	rl := &contactRateLimiter{
		attempts: make(map[string]*attemptTracker),
	}

	// Cleanup old entries every hour
	go func() {
		for {
			time.Sleep(time.Hour)
			rl.mu.Lock()
			now := time.Now()
			for key, tracker := range rl.attempts {
				if now.Sub(tracker.lastReset) > 24*time.Hour {
					delete(rl.attempts, key)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

func (rl *contactRateLimiter) checkLimit(ip, site string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	key := ip + ":" + site
	now := time.Now()

	tracker, exists := rl.attempts[key]
	if !exists {
		rl.attempts[key] = &attemptTracker{
			count:     1,
			lastReset: now,
		}
		return true
	}

	// Reset if more than 24 hours have passed
	if now.Sub(tracker.lastReset) > 24*time.Hour {
		tracker.count = 1
		tracker.lastReset = now
		return true
	}

	// Check if under limit
	if tracker.count < 50 {
		tracker.count++
		return true
	}

	return false
}

func NewContactUsController(s ContactUsService) *ContactUsController {
	return &ContactUsController{
		service:     s,
		validator:   validator.New(),
		rateLimiter: newContactRateLimiter(),
	}
}

type ContactUsRequest struct {
	Site    string                 `json:"site" validate:"required"`
	Type    string                 `json:"type" validate:"required"`
	Message string                 `json:"message" validate:"required"`
	Extras  map[string]interface{} `json:"extras"`
}


func getClientIP(ctx *gin.Context) string {
	ip := ctx.ClientIP()
	if ip == "" {
		ip, _, _ = net.SplitHostPort(ctx.Request.RemoteAddr)
	}
	return ip
}

type UpdateContactUsStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending in_progress resolved closed"`
}

// Helper function to extract JWT email from Authorization header
func (c *ContactUsController) getEmailFromJWT(ctx *gin.Context) string {
	authHeader := ctx.GetHeader("Authorization")
	if authHeader == "" {
		return "" // No auth header, user is anonymous
	}

	// Extract token from "Bearer <token>"
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return "" // Invalid format, treat as anonymous
	}

	// For now, we'll just return empty string since we don't have JWT validation here
	// In a real implementation, you'd validate the JWT and extract the email
	// This is a placeholder - the actual JWT validation should be done in the users module
	return ""
}

func (c *ContactUsController) RegisterRoutes(r *gin.Engine) {
	r.POST("/contactus", c.CreateContactUs)
	r.GET("/contactus", middleware.AdminKeyMiddleware(), c.GetAllContactUs)
	r.PATCH("/contactus/:id/status", middleware.AdminKeyMiddleware(), c.UpdateContactUsStatus)
}

func (c *ContactUsController) CreateContactUs(ctx *gin.Context) {
	var req ContactUsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.validator.Struct(req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get JWT email if user is authenticated
	jwtEmail := c.getEmailFromJWT(ctx)

	// If user is authenticated via JWT, auto-fill email from token
	if jwtEmail != "" {
		if req.Extras == nil {
			req.Extras = make(map[string]interface{})
		}
		req.Extras["email"] = jwtEmail
	}

	// Rate limiting: 50 requests per day per IP+Site
	clientIP := getClientIP(ctx)
	if !c.rateLimiter.checkLimit(clientIP, req.Site) {
		ctx.JSON(http.StatusTooManyRequests, gin.H{
			"error":   "Rate limit exceeded",
			"message": "You have exceeded the maximum of 50 submissions per day. Please try again tomorrow.",
		})
		return
	}

	extraBytes, err := json.Marshal(req.Extras)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid extras"})
		return
	}
	contact := &ContactUs{
		Site:    req.Site,
		Type:    req.Type,
		Message: req.Message,
		Extras:  extraBytes,
	}
	id, err := c.service.CreateContactUs(context.Background(), contact)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"id": id})
}

func (c *ContactUsController) GetAllContactUs(ctx *gin.Context) {
	offset, _ := strconv.Atoi(ctx.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "50"))

	if limit > 100 {
		limit = 100
	}
	if limit < 1 {
		limit = 50
	}

	results, total, err := c.service.GetAllContactUs(context.Background(), limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"contacts": results,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

func (c *ContactUsController) UpdateContactUsStatus(ctx *gin.Context) {
	id := ctx.Param("id")
	if id == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	var req UpdateContactUsStatusRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := c.service.UpdateContactUsStatus(context.Background(), id, req.Status)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

func (c *ContactUsController) Name() string {
	return "contactus"
}
