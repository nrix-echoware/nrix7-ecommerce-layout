package tryons

import (
	"context"

	"gorm.io/gorm"
)

type Repository interface {
	CreateJob(ctx context.Context, job *TryonJob) error
	AddMedia(ctx context.Context, medias []*TryonMedia) error
	UpdateJob(ctx context.Context, job *TryonJob) error
	FindJob(ctx context.Context, id uint) (*TryonJob, error)
	ListJobs(ctx context.Context, limit int) ([]TryonJob, error)
	ListMedias(ctx context.Context, limit int, offset int) ([]TryonMedia, int64, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateJob(ctx context.Context, job *TryonJob) error {
	return r.db.WithContext(ctx).Create(job).Error
}

func (r *repository) AddMedia(ctx context.Context, medias []*TryonMedia) error {
	return r.db.WithContext(ctx).Create(&medias).Error
}

func (r *repository) UpdateJob(ctx context.Context, job *TryonJob) error {
	return r.db.WithContext(ctx).Save(job).Error
}

func (r *repository) FindJob(ctx context.Context, id uint) (*TryonJob, error) {
	var job TryonJob
	if err := r.db.WithContext(ctx).Preload("Medias").First(&job, id).Error; err != nil {
		return nil, err
	}
	return &job, nil
}

func (r *repository) ListJobs(ctx context.Context, limit int) ([]TryonJob, error) {
	var jobs []TryonJob
	q := r.db.WithContext(ctx).Order("id desc").Preload("Medias")
	if limit > 0 {
		q = q.Limit(limit)
	}
	if err := q.Find(&jobs).Error; err != nil {
		return nil, err
	}
	return jobs, nil
}

func (r *repository) ListMedias(ctx context.Context, limit int, offset int) ([]TryonMedia, int64, error) {
	var medias []TryonMedia
	var total int64
	tx := r.db.WithContext(ctx).Model(&TryonMedia{})
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if limit > 0 {
		tx = tx.Limit(limit)
	}
	if offset > 0 {
		tx = tx.Offset(offset)
	}
	if err := tx.Order("id desc").Find(&medias).Error; err != nil {
		return nil, 0, err
	}
	return medias, total, nil
}


