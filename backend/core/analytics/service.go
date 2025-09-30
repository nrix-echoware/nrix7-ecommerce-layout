package analytics

import (
	"context"
)

type Service interface {
	LogVisitor(ctx context.Context, v *VisitorEvent) (string, error)
}

type service struct {
	repo Repository
}

func NewService(r Repository) Service {
	return &service{repo: r}
}

func (s *service) LogVisitor(ctx context.Context, v *VisitorEvent) (string, error) {
	return s.repo.Create(ctx, v)
} 