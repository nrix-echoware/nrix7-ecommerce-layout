package audiocontact

import (
	"time"
)

// AudioContact represents an audio contact submission
type AudioContact struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      *uint     `json:"user_id,omitempty" gorm:"index"`
	Email       string    `json:"email" gorm:"not null"`
	Name        string    `json:"name" gorm:"not null"`
	Phone       string    `json:"phone,omitempty"`
	AudioFile   string    `json:"audio_file" gorm:"not null"` // Path to the audio file
	Duration    int       `json:"duration"`                   // Duration in seconds
	FileSize    int64     `json:"file_size"`                  // File size in bytes
	MimeType    string    `json:"mime_type"`                  // e.g., "audio/webm", "audio/mp4"
	Status      string    `json:"status" gorm:"default:'pending'"` // pending, processed, archived
	Notes       string    `json:"notes,omitempty"`            // Admin notes
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	ProcessedAt *time.Time `json:"processed_at,omitempty"`
}

// AudioContactRequest represents the incoming request
type AudioContactRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Name      string `json:"name" binding:"required"`
	Phone     string `json:"phone,omitempty"`
	AudioData string `json:"audio_data" binding:"required"` // Base64 encoded audio data
	Duration  int    `json:"duration"`
	MimeType  string `json:"mime_type"`
}

// AudioContactResponse represents the response
type AudioContactResponse struct {
	ID        uint      `json:"id"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

// AudioContactListResponse for admin panel
type AudioContactListResponse struct {
	ID          uint       `json:"id"`
	UserID      *uint      `json:"user_id,omitempty"`
	Email       string     `json:"email"`
	Name        string     `json:"name"`
	Phone       string     `json:"phone,omitempty"`
	Duration    int        `json:"duration"`
	FileSize    int64      `json:"file_size"`
	MimeType    string     `json:"mime_type"`
	Status      string     `json:"status"`
	Notes       string     `json:"notes,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	ProcessedAt *time.Time `json:"processed_at,omitempty"`
	AudioURL    string     `json:"audio_url"` // URL to access the audio file
}

// TableName sets the table name for AudioContact
func (AudioContact) TableName() string {
	return "audio_contacts"
}
