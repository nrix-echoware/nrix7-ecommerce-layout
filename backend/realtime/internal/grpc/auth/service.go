package auth

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

type Claims struct {
	UserID    uuid.UUID
	Email     string
	FirstName string
	LastName  string
}

type Service interface {
	ValidateToken(ctx context.Context, token string) (*Claims, error)
}

type service struct {
	client *Client
}

func NewService(client *Client) Service {
	return &service{
		client: client,
	}
}

func (s *service) ValidateToken(ctx context.Context, token string) (*Claims, error) {
	resp, err := s.client.ValidateToken(ctx, token)
	if err != nil {
		return nil, err
	}

	if !resp.Valid {
		return nil, errors.New(resp.Error)
	}

	userID, err := uuid.Parse(resp.UserId)
	if err != nil {
		return nil, fmt.Errorf("invalid user_id: %w", err)
	}

	return &Claims{
		UserID:    userID,
		Email:     resp.Email,
		FirstName: resp.FirstName,
		LastName:  resp.LastName,
	}, nil
}

