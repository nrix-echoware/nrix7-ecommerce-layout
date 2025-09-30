package analytics

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/datatypes"
	"time"
)

type VisitorEvent struct {
	ID         uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	IP         string         `gorm:"index" json:"ip"`
	UserAgent  string         `json:"user_agent"`
	Referrer   string         `json:"referrer"`
	Path       string         `gorm:"index" json:"path"`
	Extras     datatypes.JSON `json:"extras"`
	CreatedAt  time.Time      `gorm:"autoCreateTime" json:"created_at"`
}

func (v *VisitorEvent) BeforeCreate(tx *gorm.DB) (err error) {
	v.ID = uuid.New()
	return
} 