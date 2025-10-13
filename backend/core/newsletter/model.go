package newsletter

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NewsletterSubscription represents a newsletter subscription
type NewsletterSubscription struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Email     string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (n *NewsletterSubscription) BeforeCreate(tx *gorm.DB) (err error) {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return
}

// SubscribeRequest defines the structure for newsletter subscription
type SubscribeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// SubscribeResponse defines the response for newsletter subscription
type SubscribeResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}
