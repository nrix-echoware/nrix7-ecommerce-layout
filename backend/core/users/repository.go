package users

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	// User CRUD operations
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id uuid.UUID) error

	// Authentication related
	UpdateLastLogin(ctx context.Context, userID uuid.UUID) error

	// Refresh token operations
	CreateRefreshToken(ctx context.Context, token *RefreshToken) error
	GetRefreshToken(ctx context.Context, token string) (*RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, token string) error
	RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error
	CleanupExpiredTokens(ctx context.Context) error

	// Session management
	CreateSession(ctx context.Context, session *UserSession) error
	GetSession(ctx context.Context, sessionToken string) (*UserSession, error)
	UpdateSession(ctx context.Context, session *UserSession) error
	DeleteSession(ctx context.Context, sessionToken string) error
	DeleteAllUserSessions(ctx context.Context, userID uuid.UUID) error
	CleanupExpiredSessions(ctx context.Context) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// User CRUD operations

func (r *userRepository) Create(ctx context.Context, user *User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	var user User
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&User{}, id).Error
}

func (r *userRepository) UpdateLastLogin(ctx context.Context, userID uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&User{}).
		Where("id = ?", userID).
		Update("last_login_at", now).Error
}

// Refresh token operations

func (r *userRepository) CreateRefreshToken(ctx context.Context, token *RefreshToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *userRepository) GetRefreshToken(ctx context.Context, token string) (*RefreshToken, error) {
	var refreshToken RefreshToken
	err := r.db.WithContext(ctx).
		Where("token = ? AND is_active = ? AND expires_at > ?", token, true, time.Now()).
		Preload("User").
		First(&refreshToken).Error
	if err != nil {
		return nil, err
	}
	return &refreshToken, nil
}

func (r *userRepository) RevokeRefreshToken(ctx context.Context, token string) error {
	return r.db.WithContext(ctx).Model(&RefreshToken{}).
		Where("token = ?", token).
		Update("is_active", false).Error
}

func (r *userRepository) RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&RefreshToken{}).
		Where("user_id = ?", userID).
		Update("is_active", false).Error
}

func (r *userRepository) CleanupExpiredTokens(ctx context.Context) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).
		Delete(&RefreshToken{}).Error
}

// Session management

func (r *userRepository) CreateSession(ctx context.Context, session *UserSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *userRepository) GetSession(ctx context.Context, sessionToken string) (*UserSession, error) {
	var session UserSession
	err := r.db.WithContext(ctx).
		Where("session_token = ? AND is_active = ? AND expires_at > ?", sessionToken, true, time.Now()).
		Preload("User").
		First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *userRepository) UpdateSession(ctx context.Context, session *UserSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

func (r *userRepository) DeleteSession(ctx context.Context, sessionToken string) error {
	return r.db.WithContext(ctx).Model(&UserSession{}).
		Where("session_token = ?", sessionToken).
		Update("is_active", false).Error
}

func (r *userRepository) DeleteAllUserSessions(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&UserSession{}).
		Where("user_id = ?", userID).
		Update("is_active", false).Error
}

func (r *userRepository) CleanupExpiredSessions(ctx context.Context) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).
		Delete(&UserSession{}).Error
}
