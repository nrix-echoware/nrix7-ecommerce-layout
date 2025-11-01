package newsletter

import (
	"context"
	"ecommerce-backend/common/middleware"
	"ecommerce-backend/core/users"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type NewsletterController struct {
	service NewsletterService
}

func NewNewsletterController(service NewsletterService) *NewsletterController {
	return &NewsletterController{
		service: service,
	}
}

func (c *NewsletterController) getEmailFromJWT(ctx *gin.Context) (string, error) {
	authHeader := ctx.GetHeader("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization header required")
	}

	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return "", errors.New("invalid authorization header format")
	}

	tokenString := tokenParts[1]

	jwtManager := users.NewJWTManager()
	claims, err := jwtManager.ValidateAccessToken(tokenString)
	if err != nil {
		return "", errors.New("invalid or expired token")
	}

	return claims.Email, nil
}

func (c *NewsletterController) RegisterRoutes(r *gin.Engine) {
	// Public routes (no auth required)
	r.POST("/newsletter/subscribe", c.Subscribe)
	r.POST("/newsletter/unsubscribe", c.Unsubscribe)
	r.GET("/newsletter/status", c.GetSubscriptionStatus)
	
	// Admin routes
	r.GET("/newsletter/subscriptions", middleware.AdminKeyMiddleware(), c.GetAllSubscriptions)
}

func (c *NewsletterController) Subscribe(ctx *gin.Context) {
	email, err := c.getEmailFromJWT(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	
	if email == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "No email found in authentication token"})
		return
	}

	response, err := c.service.Subscribe(context.Background(), email)
	if err != nil {
		logrus.Errorf("Failed to subscribe to newsletter: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to subscribe to newsletter"})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *NewsletterController) Unsubscribe(ctx *gin.Context) {
	// Get email from JWT token
	email, err := c.getEmailFromJWT(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	
	if email == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "No email found in authentication token"})
		return
	}

	response, err := c.service.Unsubscribe(context.Background(), email)
	if err != nil {
		logrus.Errorf("Failed to unsubscribe from newsletter: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unsubscribe from newsletter"})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *NewsletterController) GetSubscriptionStatus(ctx *gin.Context) {
	// Get email from JWT token
	email, err := c.getEmailFromJWT(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	
	if email == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "No email found in authentication token"})
		return
	}

	isSubscribed, err := c.service.IsSubscribed(context.Background(), email)
	if err != nil {
		logrus.Errorf("Failed to check subscription status: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check subscription status"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"is_subscribed": isSubscribed,
		"email":         email,
	})
}

func (c *NewsletterController) GetAllSubscriptions(ctx *gin.Context) {
	limitStr := ctx.DefaultQuery("limit", "50")
	offsetStr := ctx.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 50
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	subscriptions, total, err := c.service.GetAllSubscriptions(context.Background(), limit, offset)
	if err != nil {
		logrus.Errorf("Failed to get newsletter subscriptions: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch newsletter subscriptions"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"subscriptions": subscriptions,
		"total":         total,
		"limit":         limit,
		"offset":        offset,
	})
}

func (c *NewsletterController) Name() string {
	return "newsletter"
}
