package comments

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Comment struct {
	ID         string    `gorm:"primaryKey" json:"id"`
	ProductID  string    `gorm:"index" json:"product_id"`
	Email      string    `gorm:"not null" json:"email"`
	Comment    string    `gorm:"type:text;not null" json:"comment"`
	IsVerified bool      `gorm:"default:false" json:"is_verified"`
	RepliedTo  *string   `gorm:"index" json:"replied_to,omitempty"` // null for root comments
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	// Relations for nested queries
	Replies []Comment `gorm:"foreignKey:RepliedTo" json:"-"`
	Parent  *Comment  `gorm:"foreignKey:RepliedTo;references:ID" json:"-"`
}

// API Response structures
type CommentResponse struct {
	ID         string            `json:"id"`
	ProductID  string            `json:"product_id"`
	Email      string            `json:"email"`
	Comment    string            `json:"comment"`
	IsVerified bool              `json:"is_verified"`
	RepliedTo  *string           `json:"replied_to,omitempty"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`
	Replies    []CommentResponse `json:"replies,omitempty"`
}

type CreateCommentRequest struct {
	ProductID string  `json:"product_id" binding:"required"`
	Email     string  `json:"email" binding:"required,email"`
	Comment   string  `json:"comment" binding:"required,min=1,max=1000"`
	RepliedTo *string `json:"replied_to,omitempty"`
}

type UpdateCommentRequest struct {
	Comment string `json:"comment" binding:"required,min=1,max=1000"`
}

func (c *Comment) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return
}

// TransformCommentToResponse converts Comment model to API response format
func TransformCommentToResponse(comment *Comment) CommentResponse {
	response := CommentResponse{
		ID:         comment.ID,
		ProductID:  comment.ProductID,
		Email:      comment.Email,
		Comment:    comment.Comment,
		IsVerified: comment.IsVerified,
		RepliedTo:  comment.RepliedTo,
		CreatedAt:  comment.CreatedAt,
		UpdatedAt:  comment.UpdatedAt,
		Replies:    make([]CommentResponse, 0),
	}

	// Transform replies recursively
	for _, reply := range comment.Replies {
		response.Replies = append(response.Replies, TransformCommentToResponse(&reply))
	}

	return response
}
