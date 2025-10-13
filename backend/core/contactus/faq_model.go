package contactus

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// FAQ represents a frequently asked question with admin-assigned severity
type FAQ struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Question  string    `gorm:"type:text;not null" json:"question"`
	Answer    string    `gorm:"type:text;not null" json:"answer"`
	Marker    string    `gorm:"type:varchar(50);default:'normal'" json:"marker"`  // low, normal, high, critical
	Status    string    `gorm:"type:varchar(50);default:'pending'" json:"status"` // pending, in_progress, resolved, closed
	Order     int       `gorm:"default:0" json:"order"`                           // Display order
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (f *FAQ) BeforeCreate(tx *gorm.DB) (err error) {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return
}

// Request/Response structures
type CreateFAQRequest struct {
	Question string `json:"question" binding:"required,min=1,max=500"`
	Answer   string `json:"answer" binding:"required,min=1,max=2000"`
	Marker   string `json:"marker" binding:"omitempty,oneof=low normal high critical"`
	Order    int    `json:"order"`
}

type UpdateFAQRequest struct {
	Question *string `json:"question,omitempty" binding:"omitempty,min=1,max=500"`
	Answer   *string `json:"answer,omitempty" binding:"omitempty,min=1,max=2000"`
	Marker   *string `json:"marker,omitempty" binding:"omitempty,oneof=low normal high critical"`
	Status   *string `json:"status,omitempty" binding:"omitempty,oneof=pending in_progress resolved closed"`
	Order    *int    `json:"order,omitempty"`
	IsActive *bool   `json:"is_active,omitempty"`
}

type UpdateFAQMarkerRequest struct {
	Marker string `json:"marker" binding:"required,oneof=low normal high critical"`
}

type UpdateFAQStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending in_progress resolved closed"`
}
