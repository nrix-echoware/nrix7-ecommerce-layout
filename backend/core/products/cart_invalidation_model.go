package products

import (
	"crypto/sha256"
	"fmt"
	"time"
)

// CartInvalidation stores a single hash key that changes whenever any product is modified
type CartInvalidation struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	HashKey   string    `gorm:"unique;not null" json:"hash_key"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// GenerateHashKey creates a new hash based on the current timestamp
func GenerateHashKey() string {
	timestamp := time.Now().UnixNano()
	hash := sha256.Sum256([]byte(fmt.Sprintf("%d", timestamp)))
	return fmt.Sprintf("%x", hash)
}
