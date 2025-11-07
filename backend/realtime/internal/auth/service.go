package auth

import (
	"context"
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	jwt.RegisteredClaims
}

type Service interface {
	ValidateToken(ctx context.Context, token string) (*Claims, error)
}

type service struct {
	accessSecret []byte
}

func NewService(accessSecret string) (Service, error) {
	if accessSecret == "" {
		return nil, errors.New("missing JWT access secret")
	}

	return &service{
		accessSecret: []byte(accessSecret),
	}, nil
}

func (s *service) ValidateToken(ctx context.Context, token string) (*Claims, error) {
	if len(s.accessSecret) == 0 {
		return nil, errors.New("jwt service not initialized")
	}

	parsedToken, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.accessSecret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := parsedToken.Claims.(*Claims)
	if !ok || !parsedToken.Valid {
		return nil, errors.New("invalid token")
	}

	if claims.UserID == uuid.Nil {
		if subject, err := uuid.Parse(claims.Subject); err == nil {
			claims.UserID = subject
		}
	}

	return claims, nil
}
