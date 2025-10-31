package users

import (
	"context"
	"fmt"
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
	CreateRefreshTokenIfNotExists(ctx context.Context, token *RefreshToken) error
	GetRefreshToken(ctx context.Context, token string) (*RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, token string) error
	ReplaceRefreshToken(ctx context.Context, oldToken string, newToken *RefreshToken) error
	RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error
	CleanupExpiredTokens(ctx context.Context) error
	CleanupInactiveTokens(ctx context.Context) error

	// Session management
	CreateSession(ctx context.Context, session *UserSession) error
	GetSession(ctx context.Context, sessionToken string) (*UserSession, error)
	UpdateSession(ctx context.Context, session *UserSession) error
	DeleteSession(ctx context.Context, sessionToken string) error
	DeleteAllUserSessions(ctx context.Context, userID uuid.UUID) error
	CleanupExpiredSessions(ctx context.Context) error

	// Password reset token operations
	CreatePasswordResetToken(ctx context.Context, token *PasswordResetToken) error
	GetPasswordResetToken(ctx context.Context, token string) (*PasswordResetToken, error)
	MarkPasswordResetTokenAsUsed(ctx context.Context, token string) error
	RevokeUnusedTokensForUser(ctx context.Context, userID uuid.UUID) error
	CleanupExpiredPasswordResetTokens(ctx context.Context) error
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

func (r *userRepository) CreateRefreshTokenIfNotExists(ctx context.Context, token *RefreshToken) error {
	// Check if token already exists
	var existingToken RefreshToken
	err := r.db.WithContext(ctx).Where("token = ?", token.Token).First(&existingToken).Error
	if err == nil {
		// Token already exists, return without error
		return nil
	}
	if err != gorm.ErrRecordNotFound {
		// Some other error occurred
		return err
	}
	
	// Token doesn't exist, create it
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

func (r *userRepository) ReplaceRefreshToken(ctx context.Context, oldToken string, newToken *RefreshToken) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// First, revoke the old token
		result := tx.Model(&RefreshToken{}).
			Where("token = ?", oldToken).
			Update("is_active", false)
		if result.Error != nil {
			return fmt.Errorf("failed to revoke old token: %v", result.Error)
		}
		if result.RowsAffected == 0 {
			return fmt.Errorf("old token not found or already revoked")
		}

		// Then create the new token
		if err := tx.Create(newToken).Error; err != nil {
			return fmt.Errorf("failed to create new token: %v", err)
		}

		return nil
	})
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

func (r *userRepository) CleanupInactiveTokens(ctx context.Context) error {
	return r.db.WithContext(ctx).Where("is_active = ? AND expires_at < ?", false, time.Now()).
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

// Password reset token operations

func (r *userRepository) CreatePasswordResetToken(ctx context.Context, token *PasswordResetToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *userRepository) GetPasswordResetToken(ctx context.Context, token string) (*PasswordResetToken, error) {
	var resetToken PasswordResetToken
	err := r.db.WithContext(ctx).
		Where("token = ? AND is_used = ? AND expires_at > ?", token, false, time.Now()).
		Preload("User").
		First(&resetToken).Error
	if err != nil {
		return nil, err
	}
	return &resetToken, nil
}

func (r *userRepository) MarkPasswordResetTokenAsUsed(ctx context.Context, token string) error {
	return r.db.WithContext(ctx).Model(&PasswordResetToken{}).
		Where("token = ?", token).
		Update("is_used", true).Error
}

func (r *userRepository) RevokeUnusedTokensForUser(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&PasswordResetToken{}).
		Where("user_id = ? AND is_used = ?", userID, false).
		Update("is_used", true).Error
}

func (r *userRepository) CleanupExpiredPasswordResetTokens(ctx context.Context) error {
	return r.db.WithContext(ctx).Where("expires_at < ? OR is_used = ?", time.Now(), true).
		Delete(&PasswordResetToken{}).Error
}
