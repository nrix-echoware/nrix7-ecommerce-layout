package chat

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Thread struct {
	ThreadID  string    `gorm:"primaryKey;type:varchar(36)" json:"thread_id"`
	OrderID   string    `gorm:"not null;index;type:varchar(36)" json:"order_id"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (t *Thread) BeforeCreate(tx *gorm.DB) error {
	if t.ThreadID == "" {
		t.ThreadID = uuid.New().String()
	}
	return nil
}

type MessageOwner string

const (
	OwnerUser  MessageOwner = "user"
	OwnerAdmin MessageOwner = "admin"
)

type Message struct {
	MessageID      string       `gorm:"primaryKey;type:varchar(36)" json:"message_id"`
	ThreadID       string       `gorm:"not null;index;type:varchar(36)" json:"thread_id"`
	MessageContent string       `gorm:"type:text" json:"message_content"`
	MediaData      []byte       `gorm:"type:bytea" json:"-"` // Not exposed in JSON by default
	Owner          MessageOwner `gorm:"type:varchar(10);check:owner IN ('user','admin')" json:"owner"`
	CreatedAt      time.Time    `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time    `gorm:"autoUpdateTime" json:"updated_at"`
}

func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.MessageID == "" {
		m.MessageID = uuid.New().String()
	}
	return nil
}
