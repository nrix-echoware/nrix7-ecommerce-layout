package newsletter

import (
	"context"
	"fmt"
)

type NewsletterService interface {
	Subscribe(ctx context.Context, email string) (*SubscribeResponse, error)
	Unsubscribe(ctx context.Context, email string) (*SubscribeResponse, error)
	IsSubscribed(ctx context.Context, email string) (bool, error)
	GetAllSubscriptions(ctx context.Context, limit, offset int) ([]NewsletterSubscription, int64, error)
}

type newsletterService struct {
	repo NewsletterRepository
}

func NewNewsletterService(repo NewsletterRepository) NewsletterService {
	return &newsletterService{repo: repo}
}

func (s *newsletterService) Subscribe(ctx context.Context, email string) (*SubscribeResponse, error) {
	// Subscribe the user (repository handles duplicate checking and reactivation)
	err := s.repo.Subscribe(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to subscribe: %w", err)
	}
	
	return &SubscribeResponse{
		Message: "Successfully subscribed to our newsletter!",
		Success: true,
	}, nil
}

func (s *newsletterService) Unsubscribe(ctx context.Context, email string) (*SubscribeResponse, error) {
	err := s.repo.Unsubscribe(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to unsubscribe: %w", err)
	}
	
	return &SubscribeResponse{
		Message: "Successfully unsubscribed from our newsletter.",
		Success: true,
	}, nil
}

func (s *newsletterService) IsSubscribed(ctx context.Context, email string) (bool, error) {
	return s.repo.IsSubscribed(ctx, email)
}

func (s *newsletterService) GetAllSubscriptions(ctx context.Context, limit, offset int) ([]NewsletterSubscription, int64, error) {
	subscriptions, err := s.repo.GetAllSubscriptions(ctx, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	
	total, err := s.repo.GetTotalSubscriptions(ctx)
	if err != nil {
		return nil, 0, err
	}
	
	return subscriptions, total, nil
}
