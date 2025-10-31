package users

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)


// User represents a user account with authentication and profile information
type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Email        string     `gorm:"uniqueIndex;not null" json:"email"`
	Password     string     `gorm:"not null" json:"-"` // XOR encrypted
	FirstName    string     `gorm:"type:varchar(100)" json:"first_name"`
	LastName     string     `gorm:"type:varchar(100)" json:"last_name"`
	Phone        string     `gorm:"type:varchar(20)" json:"phone"`
	DateOfBirth  *time.Time `gorm:"type:date" json:"date_of_birth"`
	ProfileImage string     `gorm:"type:text" json:"profile_image"`

	// Address information
	AddressLine1 string `gorm:"type:varchar(255)" json:"address_line1"`
	AddressLine2 string `gorm:"type:varchar(255)" json:"address_line2"`
	City         string `gorm:"type:varchar(100)" json:"city"`
	State        string `gorm:"type:varchar(100)" json:"state"`
	PostalCode   string `gorm:"type:varchar(20)" json:"postal_code"`
	Country      string `gorm:"type:varchar(100)" json:"country"`

	// Account status
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	IsVerified  bool       `gorm:"default:false" json:"is_verified"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
}

// RefreshToken represents a refresh token for JWT authentication
type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Token     string    `gorm:"type:text;not null;uniqueIndex" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Foreign key relationship
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

// UserSession represents an active user session
type UserSession struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID       uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	SessionToken string    `gorm:"type:text;not null;uniqueIndex" json:"session_token"`
	IPAddress    string    `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent    string    `gorm:"type:text" json:"user_agent"`
	ExpiresAt    time.Time `gorm:"not null" json:"expires_at"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Foreign key relationship
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

// PasswordResetToken represents a password reset token
type PasswordResetToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Token     string    `gorm:"type:text;not null;uniqueIndex" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	IsUsed    bool      `gorm:"default:false" json:"is_used"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Foreign key relationship
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

// Request/Response DTOs

type SignUpRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type SignInRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type UpdateProfileRequest struct {
	FirstName   *string `json:"first_name,omitempty" binding:"omitempty,min=1,max=100"`
	LastName    *string `json:"last_name,omitempty" binding:"omitempty,min=1,max=100"`
	Phone       *string `json:"phone,omitempty" binding:"omitempty,min=10,max=20"`
	DateOfBirth *string `json:"date_of_birth,omitempty"` // Accept as string, convert in service
	
	// Address fields
	AddressLine1 *string `json:"address_line1,omitempty" binding:"omitempty,max=255"`
	AddressLine2 *string `json:"address_line2,omitempty" binding:"omitempty,max=255"`
	City         *string `json:"city,omitempty" binding:"omitempty,max=100"`
	State        *string `json:"state,omitempty" binding:"omitempty,max=100"`
	PostalCode   *string `json:"postal_code,omitempty" binding:"omitempty,max=20"`
	Country      *string `json:"country,omitempty" binding:"omitempty,max=100"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

type GeneratePasswordResetTokenRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type GeneratePasswordResetTokenResponse struct {
	Token     string `json:"token"`
	ResetLink string `json:"reset_link"`
	ExpiresAt string `json:"expires_at"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newpassword" binding:"required,min=6"`
}

// GORM hooks
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return
}

func (r *RefreshToken) BeforeCreate(tx *gorm.DB) (err error) {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return
}

func (s *UserSession) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return
}

func (p *PasswordResetToken) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return
}
