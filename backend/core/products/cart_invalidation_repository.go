package products

import (
	"context"
	"gorm.io/gorm"
)

type CartInvalidationRepository interface {
	GetCurrentHash(ctx context.Context) (string, error)
	InvalidateCart(ctx context.Context) (string, error)
	InitializeHash(ctx context.Context) error
}

type cartInvalidationRepository struct {
	db *gorm.DB
}

func NewCartInvalidationRepository(db *gorm.DB) CartInvalidationRepository {
	return &cartInvalidationRepository{db: db}
}

// GetCurrentHash retrieves the current cart hash key
func (r *cartInvalidationRepository) GetCurrentHash(ctx context.Context) (string, error) {
	var invalidation CartInvalidation
	err := r.db.WithContext(ctx).First(&invalidation).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Initialize if not exists
			if initErr := r.InitializeHash(ctx); initErr != nil {
				return "", initErr
			}
			return r.GetCurrentHash(ctx)
		}
		return "", err
	}
	return invalidation.HashKey, nil
}

// InvalidateCart generates a new hash key, invalidating all existing carts
func (r *cartInvalidationRepository) InvalidateCart(ctx context.Context) (string, error) {
	newHash := GenerateHashKey()
	
	// Update or create the hash
	var invalidation CartInvalidation
	err := r.db.WithContext(ctx).First(&invalidation).Error
	if err == gorm.ErrRecordNotFound {
		// Create new record
		invalidation = CartInvalidation{
			HashKey: newHash,
		}
		err = r.db.WithContext(ctx).Create(&invalidation).Error
	} else if err == nil {
		// Update existing record
		invalidation.HashKey = newHash
		err = r.db.WithContext(ctx).Save(&invalidation).Error
	}
	
	if err != nil {
		return "", err
	}
	return newHash, nil
}

// InitializeHash creates the initial hash if it doesn't exist
func (r *cartInvalidationRepository) InitializeHash(ctx context.Context) error {
	var count int64
	r.db.WithContext(ctx).Model(&CartInvalidation{}).Count(&count)
	
	if count == 0 {
		invalidation := CartInvalidation{
			HashKey: GenerateHashKey(),
		}
		return r.db.WithContext(ctx).Create(&invalidation).Error
	}
	return nil
} 