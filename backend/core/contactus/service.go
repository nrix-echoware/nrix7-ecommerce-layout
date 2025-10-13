package contactus

import (
	"context"
	"fmt"
)

type ContactUsService interface {
	CreateContactUs(ctx context.Context, contact *ContactUs) (string, error)
	FuzzySearchContactUs(ctx context.Context, query map[string]interface{}, skip, limit int) ([]ContactUs, int64, error)
	GetAllContactUs(ctx context.Context, limit, offset int) ([]ContactUs, int64, error)
	UpdateContactUsStatus(ctx context.Context, id string, status string) error
}

type contactUsService struct {
	repo ContactUsRepository
}

func NewContactUsService(repo ContactUsRepository) ContactUsService {
	return &contactUsService{repo: repo}
}

func (s *contactUsService) CreateContactUs(ctx context.Context, contact *ContactUs) (string, error) {
	// Async-ready: could use goroutine/channel if needed
	if err := s.repo.Create(ctx, contact); err != nil {
		return "", err
	}
	return contact.ID.String(), nil
}

func (s *contactUsService) FuzzySearchContactUs(ctx context.Context, query map[string]interface{}, skip, limit int) ([]ContactUs, int64, error) {
	results, err := s.repo.FuzzySearch(ctx, query, skip, limit)
	if err != nil {
		return nil, 0, err
	}
	total, err := s.repo.Count(ctx, query)
	if err != nil {
		return nil, 0, err
	}
	return results, total, nil
}

func (s *contactUsService) GetAllContactUs(ctx context.Context, limit, offset int) ([]ContactUs, int64, error) {
	results, err := s.repo.GetAll(ctx, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	total, err := s.repo.GetTotalCount(ctx)
	if err != nil {
		return nil, 0, err
	}
	return results, total, nil
}

func (s *contactUsService) UpdateContactUsStatus(ctx context.Context, id string, status string) error {
	// Validate status
	validStatuses := map[string]bool{
		"pending":     true,
		"in_progress": true,
		"resolved":    true,
		"closed":      true,
	}

	if !validStatuses[status] {
		return fmt.Errorf("invalid status: %s", status)
	}

	return s.repo.UpdateStatus(ctx, id, status)
}
