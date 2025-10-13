package analytics

import (
	"context"
	"gorm.io/gorm"
)

type Repository interface {
	Create(ctx context.Context, v *VisitorEvent) (string, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, v *VisitorEvent) (string, error) {
	if err := r.db.WithContext(ctx).Create(v).Error; err != nil {
		return "", err
	}
	return v.ID.String(), nil
}
