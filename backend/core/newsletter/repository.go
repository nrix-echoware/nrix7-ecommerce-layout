package newsletter

import (
	"context"
	"errors"
	"gorm.io/gorm"
)

type NewsletterRepository interface {
	Subscribe(ctx context.Context, email string) error
	Unsubscribe(ctx context.Context, email string) error
	IsSubscribed(ctx context.Context, email string) (bool, error)
	GetAllSubscriptions(ctx context.Context, limit, offset int) ([]NewsletterSubscription, error)
	GetTotalSubscriptions(ctx context.Context) (int64, error)
}

type newsletterRepository struct {
	db *gorm.DB
}

func NewNewsletterRepository(db *gorm.DB) NewsletterRepository {
	return &newsletterRepository{db: db}
}

func (r *newsletterRepository) Subscribe(ctx context.Context, email string) error {
	// Check if already subscribed
	var existing NewsletterSubscription
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&existing).Error
	
	if err == nil {
		// Email already exists, update to active if not already active
		if !existing.IsActive {
			return r.db.WithContext(ctx).Model(&existing).Update("is_active", true).Error
		}
		// Already active, silently ignore (as requested)
		return nil
	}
	
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		// Some other error occurred
		return err
	}
	
	// Create new subscription
	subscription := &NewsletterSubscription{
		Email:    email,
		IsActive: true,
	}
	
	return r.db.WithContext(ctx).Create(subscription).Error
}

func (r *newsletterRepository) Unsubscribe(ctx context.Context, email string) error {
	return r.db.WithContext(ctx).Model(&NewsletterSubscription{}).
		Where("email = ?", email).
		Update("is_active", false).Error
}

func (r *newsletterRepository) IsSubscribed(ctx context.Context, email string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&NewsletterSubscription{}).
		Where("email = ? AND is_active = ?", email, true).
		Count(&count).Error
	
	return count > 0, err
}

func (r *newsletterRepository) GetAllSubscriptions(ctx context.Context, limit, offset int) ([]NewsletterSubscription, error) {
	var subscriptions []NewsletterSubscription
	err := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&subscriptions).Error
	
	return subscriptions, err
}

func (r *newsletterRepository) GetTotalSubscriptions(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&NewsletterSubscription{}).
		Where("is_active = ?", true).
		Count(&count).Error
	
	return count, err
}
