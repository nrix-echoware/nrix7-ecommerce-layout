package users

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type UserService interface {
	// Authentication
	SignUp(ctx context.Context, req *SignUpRequest) (*AuthResponse, error)
	SignIn(ctx context.Context, req *SignInRequest, ipAddress, userAgent string) (*AuthResponse, error)
	RefreshToken(ctx context.Context, req *RefreshTokenRequest) (*AuthResponse, error)
	SignOut(ctx context.Context, refreshToken string) error
	SignOutAll(ctx context.Context, userID uuid.UUID) error

	// User management
	GetProfile(ctx context.Context, userID uuid.UUID) (*User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, req *UpdateProfileRequest) (*User, error)
	ChangePassword(ctx context.Context, userID uuid.UUID, req *ChangePasswordRequest) error

	// Token validation
	ValidateToken(ctx context.Context, tokenString string) (*Claims, error)
	GetUserFromToken(ctx context.Context, tokenString string) (*User, error)

	// Session management
	CreateSession(ctx context.Context, userID uuid.UUID, ipAddress, userAgent string) (*UserSession, error)
	ValidateSession(ctx context.Context, sessionToken string) (*UserSession, error)
	DeleteSession(ctx context.Context, sessionToken string) error

	// Cleanup
	CleanupExpiredTokens(ctx context.Context) error
	CleanupExpiredSessions(ctx context.Context) error

	// Password reset
	GeneratePasswordResetToken(ctx context.Context, email string) (*GeneratePasswordResetTokenResponse, error)
	ResetPassword(ctx context.Context, req *ResetPasswordRequest) error
}

type userService struct {
	repo       UserRepository
	jwtManager *JWTManager
}

func NewUserService(repo UserRepository) UserService {
	return &userService{
		repo:       repo,
		jwtManager: NewJWTManager(),
	}
}

// Authentication methods

func (s *userService) SignUp(ctx context.Context, req *SignUpRequest) (*AuthResponse, error) {
	// Check if user already exists
	existingUser, err := s.repo.GetByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Create new user
	user := &User{
		Email:      req.Email,
		Password:   HashPassword(req.Password),
		IsActive:   true,
		IsVerified: false, // No OTP verification for now
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}

	// Generate tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %v", err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %v", err)
	}

	// Store refresh token
	refreshTokenRecord := &RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(s.jwtManager.GetRefreshTokenExpiry()),
		IsActive:  true,
	}

	if err := s.repo.CreateRefreshToken(ctx, refreshTokenRecord); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %v", err)
	}

	// Update last login
	s.repo.UpdateLastLogin(ctx, user.ID)

	return &AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.jwtManager.GetTokenExpiry().Seconds()),
	}, nil
}

func (s *userService) SignIn(ctx context.Context, req *SignInRequest, ipAddress, userAgent string) (*AuthResponse, error) {
	// Get user by email
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	// Verify password
	if !VerifyPassword(req.Password, user.Password) {
		return nil, errors.New("invalid email or password")
	}

	// Generate tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %v", err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %v", err)
	}

	// Store refresh token
	refreshTokenRecord := &RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(s.jwtManager.GetRefreshTokenExpiry()),
		IsActive:  true,
	}

	if err := s.repo.CreateRefreshToken(ctx, refreshTokenRecord); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %v", err)
	}

	// Create session
	_, err = s.CreateSession(ctx, user.ID, ipAddress, userAgent)
	if err != nil {
		// Log error but don't fail the sign in
		fmt.Printf("Failed to create session: %v\n", err)
	}

	// Update last login
	s.repo.UpdateLastLogin(ctx, user.ID)

	return &AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.jwtManager.GetTokenExpiry().Seconds()),
	}, nil
}

func (s *userService) RefreshToken(ctx context.Context, req *RefreshTokenRequest) (*AuthResponse, error) {
	// Validate refresh token
	_, err := s.jwtManager.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		fmt.Printf("Refresh token validation failed: %v\n", err)
		return nil, errors.New("invalid refresh token")
	}

	// Get refresh token from database
	refreshTokenRecord, err := s.repo.GetRefreshToken(ctx, req.RefreshToken)
	if err != nil {
		fmt.Printf("Refresh token not found in database: %v\n", err)
		return nil, errors.New("invalid refresh token")
	}

	// Get user
	user, err := s.repo.GetByID(ctx, refreshTokenRecord.UserID)
	if err != nil {
		fmt.Printf("User not found: %v\n", err)
		return nil, errors.New("user not found")
	}

	// Check if user is still active
	if !user.IsActive {
		fmt.Printf("User account is deactivated: %s\n", user.ID)
		return nil, errors.New("account is deactivated")
	}

	// Generate new access token
	accessToken, err := s.jwtManager.GenerateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %v", err)
	}

	// Generate new refresh token
	newRefreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %v", err)
	}

	fmt.Printf("Refreshing token for user %s, old token: %s, new token: %s\n", 
		user.ID, req.RefreshToken[:20]+"...", newRefreshToken[:20]+"...")

	// Use atomic operation to revoke old token and create new one
	if err := s.repo.ReplaceRefreshToken(ctx, req.RefreshToken, &RefreshToken{
		UserID:    user.ID,
		Token:     newRefreshToken,
		ExpiresAt: time.Now().Add(s.jwtManager.GetRefreshTokenExpiry()),
		IsActive:  true,
	}); err != nil {
		fmt.Printf("Failed to replace refresh token: %v\n", err)
		return nil, fmt.Errorf("failed to replace refresh token: %v", err)
	}

	fmt.Printf("Successfully refreshed token for user %s\n", user.ID)

	return &AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(s.jwtManager.GetTokenExpiry().Seconds()),
	}, nil
}

func (s *userService) SignOut(ctx context.Context, refreshToken string) error {
	return s.repo.RevokeRefreshToken(ctx, refreshToken)
}

func (s *userService) SignOutAll(ctx context.Context, userID uuid.UUID) error {
	// Revoke all refresh tokens
	if err := s.repo.RevokeAllUserTokens(ctx, userID); err != nil {
		return err
	}

	// Delete all sessions
	return s.repo.DeleteAllUserSessions(ctx, userID)
}

func (s *userService) CleanupExpiredTokens(ctx context.Context) error {
	return s.repo.CleanupExpiredTokens(ctx)
}

func (s *userService) CleanupInactiveTokens(ctx context.Context) error {
	return s.repo.CleanupInactiveTokens(ctx)
}

// User management methods

func (s *userService) GetProfile(ctx context.Context, userID uuid.UUID) (*User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *userService) UpdateProfile(ctx context.Context, userID uuid.UUID, req *UpdateProfileRequest) (*User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.FirstName != nil {
		user.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		user.LastName = *req.LastName
	}
	if req.Phone != nil {
		user.Phone = *req.Phone
	}
	if req.DateOfBirth != nil {
		// Parse date string to time.Time
		dateStr := *req.DateOfBirth
		if dateStr != "" {
			// Try different date formats
			formats := []string{
				"2006-01-02",           // YYYY-MM-DD
				"2006-01-02T15:04:05Z", // RFC3339
				"2006-01-02T15:04:05Z07:00", // RFC3339 with timezone
			}
			
			for _, format := range formats {
				if t, err := time.Parse(format, dateStr); err == nil {
					user.DateOfBirth = &t
					break
				}
			}
		}
	}
	if req.AddressLine1 != nil {
		user.AddressLine1 = *req.AddressLine1
	}
	if req.AddressLine2 != nil {
		user.AddressLine2 = *req.AddressLine2
	}
	if req.City != nil {
		user.City = *req.City
	}
	if req.State != nil {
		user.State = *req.State
	}
	if req.PostalCode != nil {
		user.PostalCode = *req.PostalCode
	}
	if req.Country != nil {
		user.Country = *req.Country
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userService) ChangePassword(ctx context.Context, userID uuid.UUID, req *ChangePasswordRequest) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	// Verify current password
	if !VerifyPassword(req.CurrentPassword, user.Password) {
		return errors.New("current password is incorrect")
	}

	// Update password
	user.Password = HashPassword(req.NewPassword)

	return s.repo.Update(ctx, user)
}

// Token validation methods

func (s *userService) ValidateToken(ctx context.Context, tokenString string) (*Claims, error) {
	return s.jwtManager.ValidateAccessToken(tokenString)
}

func (s *userService) GetUserFromToken(ctx context.Context, tokenString string) (*User, error) {
	claims, err := s.ValidateToken(ctx, tokenString)
	if err != nil {
		return nil, err
	}

	return s.repo.GetByID(ctx, claims.UserID)
}

// Session management methods

func (s *userService) CreateSession(ctx context.Context, userID uuid.UUID, ipAddress, userAgent string) (*UserSession, error) {
	// Generate session token
	sessionToken, err := GenerateToken(32)
	if err != nil {
		return nil, err
	}

	session := &UserSession{
		UserID:       userID,
		SessionToken: sessionToken,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		ExpiresAt:    time.Now().Add(30 * 24 * time.Hour), // 30 days
		IsActive:     true,
	}

	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

func (s *userService) ValidateSession(ctx context.Context, sessionToken string) (*UserSession, error) {
	return s.repo.GetSession(ctx, sessionToken)
}

func (s *userService) DeleteSession(ctx context.Context, sessionToken string) error {
	return s.repo.DeleteSession(ctx, sessionToken)
}

// Cleanup methods

func (s *userService) CleanupExpiredSessions(ctx context.Context) error {
	return s.repo.CleanupExpiredSessions(ctx)
}

// Password reset methods

func (s *userService) GeneratePasswordResetToken(ctx context.Context, email string) (*GeneratePasswordResetTokenResponse, error) {
	// Get user by email
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// Revoke any existing unused tokens for this user
	if err := s.repo.RevokeUnusedTokensForUser(ctx, user.ID); err != nil {
		return nil, fmt.Errorf("failed to revoke existing tokens: %v", err)
	}

	// Generate unique alphanumeric token based on password hash
	// Hash the password hash with timestamp to create a unique alphanumeric token
	timestamp := time.Now().UnixNano()
	
	// Generate random alphanumeric suffix (using hex which is alphanumeric)
	randomSuffix, err := GenerateToken(16) // 16 bytes = 32 hex chars
	if err != nil {
		return nil, fmt.Errorf("failed to generate token suffix: %v", err)
	}
	
	// Create a hash-like string from password hash + timestamp + random
	// This ensures it's alphanumeric and unique
	// Take first 16 chars of password hash (if available), combine with timestamp and random
	passwordHashPart := user.Password
	if len(passwordHashPart) > 16 {
		passwordHashPart = passwordHashPart[:16]
	}
	// If password hash is empty or all zeros, use a fallback
	if passwordHashPart == "" || passwordHashPart == "00000000000000" {
		passwordHashPart, _ = GenerateToken(8) // Generate 8 bytes = 16 hex chars as fallback
	}
	
	// Combine into alphanumeric token: passwordHashPart + timestamp(hex) + randomSuffix
	timestampHex := fmt.Sprintf("%x", timestamp) // Convert to hex (alphanumeric)
	if len(timestampHex) > 16 {
		timestampHex = timestampHex[:16]
	}
	token := fmt.Sprintf("%s%s%s", passwordHashPart, timestampHex, randomSuffix)
	
	// Ensure minimum length and alphanumeric only (hex is already alphanumeric)
	if len(token) < 32 {
		// Pad with more random if needed
		extraRandom, _ := GenerateToken(8)
		token = token + extraRandom
	}

	// Create reset token record
	resetToken := &PasswordResetToken{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24 hour expiry
		IsUsed:    false,
	}

	if err := s.repo.CreatePasswordResetToken(ctx, resetToken); err != nil {
		return nil, fmt.Errorf("failed to create reset token: %v", err)
	}

	return &GeneratePasswordResetTokenResponse{
		Token:     token,
		ExpiresAt: resetToken.ExpiresAt.Format(time.RFC3339),
	}, nil
}

func (s *userService) ResetPassword(ctx context.Context, req *ResetPasswordRequest) error {
	// Get reset token
	resetToken, err := s.repo.GetPasswordResetToken(ctx, req.Token)
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	// Get user
	user, err := s.repo.GetByID(ctx, resetToken.UserID)
	if err != nil {
		return errors.New("user not found")
	}

	// Update password
	user.Password = HashPassword(req.NewPassword)
	if err := s.repo.Update(ctx, user); err != nil {
		return fmt.Errorf("failed to update password: %v", err)
	}

	// Mark token as used
	if err := s.repo.MarkPasswordResetTokenAsUsed(ctx, req.Token); err != nil {
		return fmt.Errorf("failed to mark token as used: %v", err)
	}

	return nil
}

