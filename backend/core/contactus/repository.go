package contactus

import (
	"context"
	"gorm.io/gorm"
)

type ContactUsRepository interface {
	Create(ctx context.Context, contact *ContactUs) error
	FuzzySearch(ctx context.Context, query map[string]interface{}, skip, limit int) ([]ContactUs, error)
	Count(ctx context.Context, query map[string]interface{}) (int64, error)
	GetAll(ctx context.Context, limit, offset int) ([]ContactUs, error)
	GetTotalCount(ctx context.Context) (int64, error)
	UpdateStatus(ctx context.Context, id string, status string) error
}

type contactUsRepository struct {
	db *gorm.DB
}

func NewContactUsRepository(db *gorm.DB) ContactUsRepository {
	return &contactUsRepository{db: db}
}

func (r *contactUsRepository) Create(ctx context.Context, contact *ContactUs) error {
	return r.db.WithContext(ctx).Create(contact).Error
}

func (r *contactUsRepository) FuzzySearch(ctx context.Context, query map[string]interface{}, skip, limit int) ([]ContactUs, error) {
	var results []ContactUs
	db := r.db.WithContext(ctx).Model(&ContactUs{})
	for k, v := range query {
		db = db.Where(k+" LIKE ?", "%"+v.(string)+"%")
	}
	db = db.Order("created_at DESC").Offset(skip).Limit(limit)
	if err := db.Find(&results).Error; err != nil {
		return nil, err
	}
	return results, nil
}

func (r *contactUsRepository) Count(ctx context.Context, query map[string]interface{}) (int64, error) {
	var count int64
	db := r.db.WithContext(ctx).Model(&ContactUs{})
	for k, v := range query {
		db = db.Where(k+" LIKE ?", "%"+v.(string)+"%")
	}
	if err := db.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *contactUsRepository) GetAll(ctx context.Context, limit, offset int) ([]ContactUs, error) {
	var results []ContactUs
	err := r.db.WithContext(ctx).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&results).Error
	return results, err
}

func (r *contactUsRepository) GetTotalCount(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&ContactUs{}).Count(&count).Error
	return count, err
}

func (r *contactUsRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.db.WithContext(ctx).Model(&ContactUs{}).
		Where("id = ?", id).
		Update("status", status).Error
}
