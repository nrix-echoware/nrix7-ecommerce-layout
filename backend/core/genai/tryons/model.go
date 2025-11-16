package tryons

import (
	"time"
)

type TryonStatus string

const (
	TryonStatusPending    TryonStatus = "pending"
	TryonStatusProcessing TryonStatus = "processing"
	TryonStatusCompleted  TryonStatus = "completed"
	TryonStatusError      TryonStatus = "error"
)

type TryonJob struct {
	ID         uint       `gorm:"primaryKey"`
	Category   string     `gorm:"size:128;index"`
	Prompt     string     `gorm:"type:text"`
	Status     TryonStatus `gorm:"size:32;index"`
	ErrorMsg   string     `gorm:"type:text"`
	RetryCount int        `gorm:"default:0"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	Medias     []TryonMedia `gorm:"foreignKey:JobID;constraint:OnDelete:CASCADE"`
}

type TryonMedia struct {
	ID        uint      `gorm:"primaryKey"`
	JobID     uint      `gorm:"index;not null"`
	FilePath  string    `gorm:"size:512"`
	MimeType  string    `gorm:"size:128"`
	SizeBytes int64
	CreatedAt time.Time
}


