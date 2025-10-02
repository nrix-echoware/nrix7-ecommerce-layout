package comments

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CommentController struct {
	service CommentService
}

func NewCommentController(service CommentService) *CommentController {
	return &CommentController{service: service}
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

	comment, err := ctrl.service.CreateComment(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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

// RegisterRoutes registers comment routes with the Gin router
func (ctrl *CommentController) RegisterRoutes(r *gin.Engine) {
	// Comment routes
	v1 := r.Group("/api/v1")
	{
		// Product comments
		v1.GET("/products/:product_id/comments", ctrl.GetCommentsForProduct)
		v1.POST("/products/:product_id/comments", ctrl.CreateComment)
		
		// Individual comment operations
		v1.PUT("/comments/:id", ctrl.UpdateComment)
		v1.DELETE("/comments/:id", ctrl.DeleteComment)
		v1.GET("/comments/:id/replies", ctrl.GetReplies)
	}
}
