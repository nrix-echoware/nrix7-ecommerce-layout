package users

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWT Claims structure
type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	jwt.RegisteredClaims
}

// JWT Manager
type JWTManager struct {
	accessTokenSecret  string
	refreshTokenSecret string
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
}

// NewJWTManager creates a new JWT manager
func NewJWTManager() *JWTManager {
	return &JWTManager{
		accessTokenSecret:  getJWTSecret("JWT_ACCESS_SECRET"),
		refreshTokenSecret: getJWTSecret("JWT_REFRESH_SECRET"),
		accessTokenExpiry:  15 * time.Minute,   // 15 minutes
		refreshTokenExpiry: 7 * 24 * time.Hour, // 7 days
	}
}

// GenerateAccessToken generates a new access token
func (j *JWTManager) GenerateAccessToken(user *User) (string, error) {
	claims := &Claims{
		UserID:    user.ID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.accessTokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "nrix7-ecommerce",
			Subject:   user.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.accessTokenSecret))
}

// GenerateRefreshToken generates a new refresh token
func (j *JWTManager) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	// Generate a random component to ensure uniqueness
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %v", err)
	}
	randomComponent := hex.EncodeToString(randomBytes)

	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.refreshTokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "nrix7-ecommerce",
			Subject:   userID.String(),
			ID:        randomComponent, // Add random ID to ensure uniqueness
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.refreshTokenSecret))
}

// ValidateAccessToken validates an access token and returns claims
func (j *JWTManager) ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.accessTokenSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// ValidateRefreshToken validates a refresh token and returns claims
func (j *JWTManager) ValidateRefreshToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.refreshTokenSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid refresh token")
}

// GetTokenExpiry returns the access token expiry duration
func (j *JWTManager) GetTokenExpiry() time.Duration {
	return j.accessTokenExpiry
}

// GetRefreshTokenExpiry returns the refresh token expiry duration
func (j *JWTManager) GetRefreshTokenExpiry() time.Duration {
	return j.refreshTokenExpiry
}

// getJWTSecret gets JWT secret from environment or generates a default one
func getJWTSecret(envKey string) string {
	secret := os.Getenv(envKey)
	if secret == "" {
		// Generate a default secret based on admin key
		adminKey := os.Getenv("ADMIN_API_KEY")
		if adminKey == "" {
			adminKey = "nrix7-ecommerce-default-key-2024"
		}

		if envKey == "JWT_ACCESS_SECRET" {
			secret = adminKey + "-access-token-secret"
		} else {
			secret = adminKey + "-refresh-token-secret"
		}
	}
	return secret
}
