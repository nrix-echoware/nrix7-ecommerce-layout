package comments

import (
	"net/http"
	"strconv"
	"strings"

	"ecommerce-backend/common/security"
	"ecommerce-backend/core/users"
	"github.com/gin-gonic/gin"
)

type CommentController struct {
	service     CommentService
	rateLimiter *security.CommentRateLimiter
}

// Helper function to extract JWT email from Authorization header
func (ctrl *CommentController) getEmailFromJWT(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", nil // No auth header, user is anonymous
	}

	// Extract token from "Bearer <token>"
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return "", nil // Invalid format, treat as anonymous
	}

	tokenString := tokenParts[1]

	// Validate JWT token and extract email
	jwtManager := users.NewJWTManager()
	claims, err := jwtManager.ValidateAccessToken(tokenString)
	if err != nil {
		return "", err // Invalid token
	}

	return claims.Email, nil
}

func NewCommentController(service CommentService, rateLimiter *security.CommentRateLimiter) *CommentController {
	return &CommentController{
		service:     service,
		rateLimiter: rateLimiter,
	}
}

// GetCommentsForProduct godoc
// @Summary Get comments for a product
// @Description Get a tree of comments for a specific product with pagination
// @Tags Comments
// @Accept json
// @Produce json
// @Param product_id path string true "Product ID"
// @Param limit query int false "Limit (default 10, max 50)" minimum(1) maximum(50)
// @Param offset query int false "Offset (default 0)" minimum(0)
// @Success 200 {array} CommentResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /products/{product_id}/comments [get]
func (ctrl *CommentController) GetCommentsForProduct(c *gin.Context) {
	productID := c.Param("product_id")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product_id is required"})
		return
	}

	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 10
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	comments, err := ctrl.service.GetCommentsForProduct(productID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, comments)
}

// CreateComment godoc
// @Summary Create a new comment
// @Description Create a new comment for a product
// @Tags Comments
// @Accept json
// @Produce json
// @Param product_id path string true "Product ID"
// @Param comment body CreateCommentRequest true "Comment data"
// @Success 201 {object} CommentResponse
// @Failure 400 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /products/{product_id}/comments [post]
func (ctrl *CommentController) CreateComment(c *gin.Context) {
	productID := c.Param("product_id")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product_id is required"})
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set the product ID from the URL parameter
	req.ProductID = productID

	// Get JWT email - authentication is required for comments
	jwtEmail, err := ctrl.getEmailFromJWT(c)
	if err != nil || jwtEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required to post comments"})
		return
	}


	// Get client IP
	clientIP := c.ClientIP()

	// Check rate limit BEFORE processing
	rateLimitResult := ctrl.rateLimiter.CheckAndLog(clientIP, productID, jwtEmail)
	if !rateLimitResult.Allowed {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":        "Rate limit exceeded",
			"message":      rateLimitResult.Reason,
			"attempts":     rateLimitResult.AttemptsCount,
			"max_attempts": 3,
			"retry_after":  rateLimitResult.NextAvailable,
		})
		return
	}

	// Create the comment
	comment, err := ctrl.service.CreateComment(&req, jwtEmail)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log successful comment creation
	ctrl.rateLimiter.LogSuccess(clientIP, productID, jwtEmail)

	response := TransformCommentToResponse(comment)
	c.JSON(http.StatusCreated, response)
}

// UpdateComment godoc
// @Summary Update a comment
// @Description Update an existing comment
// @Tags Comments
// @Accept json
// @Produce json
// @Param id path string true "Comment ID"
// @Param comment body UpdateCommentRequest true "Updated comment data"
// @Success 200 {object} CommentResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /comments/{id} [put]
func (ctrl *CommentController) UpdateComment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "comment id is required"})
		return
	}

	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment, err := ctrl.service.UpdateComment(id, &req)
	if err != nil {
		if err.Error() == "comment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response := TransformCommentToResponse(comment)
	c.JSON(http.StatusOK, response)
}

// DeleteComment godoc
// @Summary Delete a comment
// @Description Delete a comment by ID
// @Tags Comments
// @Accept json
// @Produce json
// @Param id path string true "Comment ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /comments/{id} [delete]
func (ctrl *CommentController) DeleteComment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "comment id is required"})
		return
	}

	err := ctrl.service.DeleteComment(id)
	if err != nil {
		if err.Error() == "comment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetReplies godoc
// @Summary Get replies for a comment
// @Description Get replies for a specific comment with pagination
// @Tags Comments
// @Accept json
// @Produce json
// @Param id path string true "Comment ID"
// @Param limit query int false "Limit (default 10, max 50)" minimum(1) maximum(50)
// @Param offset query int false "Offset (default 0)" minimum(0)
// @Success 200 {array} Comment
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /comments/{id}/replies [get]
func (ctrl *CommentController) GetReplies(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "comment id is required"})
		return
	}

	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 10
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	replies, err := ctrl.service.GetReplies(id, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch replies"})
		return
	}

	c.JSON(http.StatusOK, replies)
}

// GetAllComments godoc
// @Summary Get all comments (Admin)
// @Description Get all comments with pagination and optional filter
// @Tags Comments
// @Accept json
// @Produce json
// @Param limit query int false "Limit (default 50, max 100)" minimum(1) maximum(100)
// @Param offset query int false "Offset (default 0)" minimum(0)
// @Param filter query string false "Filter: all, approved, pending" Enums(all, approved, pending)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /comments [get]
func (ctrl *CommentController) GetAllComments(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	filter := c.DefaultQuery("filter", "all")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	comments, total, err := ctrl.service.GetAllCommentsWithFilter(limit, offset, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"comments": comments,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
		"filter":   filter,
	})
}

// ApproveComment godoc
// @Summary Approve a comment (Admin)
// @Description Approve a comment to make it visible on the storefront
// @Tags Comments
// @Accept json
// @Produce json
// @Param id path string true "Comment ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /comments/{id}/approve [post]
func (ctrl *CommentController) ApproveComment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "comment id is required"})
		return
	}

	err := ctrl.service.ApproveComment(id)
	if err != nil {
		if err.Error() == "comment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment approved successfully"})
}

// RejectComment godoc
// @Summary Reject a comment (Admin)
// @Description Reject a comment to hide it from the storefront
// @Tags Comments
// @Accept json
// @Produce json
// @Param id path string true "Comment ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /comments/{id}/reject [post]
func (ctrl *CommentController) RejectComment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "comment id is required"})
		return
	}

	err := ctrl.service.RejectComment(id)
	if err != nil {
		if err.Error() == "comment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment rejected successfully"})
}

// RegisterRoutes registers comment routes with the Gin router
func (ctrl *CommentController) RegisterRoutes(r *gin.Engine) {
	// Product comments (public)
	r.GET("/comments/products/:product_id/comments", ctrl.GetCommentsForProduct)
	r.POST("/comments/products/:product_id/comments", ctrl.CreateComment)

	// Individual comment operations
	r.PUT("/comments/:id", ctrl.UpdateComment)
	r.DELETE("/comments/:id", ctrl.DeleteComment)
	r.GET("/comments/:id/replies", ctrl.GetReplies)

	// Admin operations
	r.GET("/comments", ctrl.GetAllComments)
	r.POST("/comments/:id/approve", ctrl.ApproveComment)
	r.POST("/comments/:id/reject", ctrl.RejectComment)
}
