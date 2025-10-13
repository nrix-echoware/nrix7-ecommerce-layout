package contactus

import (
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"time"
)

type ContactUs struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Site      string         `gorm:"index" json:"site"`
	Type      string         `gorm:"index" json:"type"`
	Message   string         `json:"message"`
	Extras    datatypes.JSON `json:"extras"`
	Status    string         `gorm:"type:varchar(50);default:'pending'" json:"status"` // pending, in_progress, resolved, closed
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
}

func (c *ContactUs) BeforeCreate(tx *gorm.DB) (err error) {
	c.ID = uuid.New()
	return
}
