package audiocontact

import (
	"gorm.io/gorm"
)

type AudioContactRepository interface {
	Create(audioContact *AudioContact) error
	GetByID(id uint) (*AudioContact, error)
	GetAll(limit, offset int) ([]AudioContact, error)
	GetByStatus(status string, limit, offset int) ([]AudioContact, error)
	Update(audioContact *AudioContact) error
	UpdateStatus(id uint, status string, notes string) error
	Delete(id uint) error
	GetCount() (int64, error)
	GetCountByStatus(status string) (int64, error)
}

type audioContactRepository struct {
	db *gorm.DB
}

func NewAudioContactRepository(db *gorm.DB) AudioContactRepository {
	return &audioContactRepository{db: db}
}

func (r *audioContactRepository) Create(audioContact *AudioContact) error {
	return r.db.Create(audioContact).Error
}

func (r *audioContactRepository) GetByID(id uint) (*AudioContact, error) {
	var audioContact AudioContact
	err := r.db.First(&audioContact, id).Error
	if err != nil {
		return nil, err
	}
	return &audioContact, nil
}

func (r *audioContactRepository) GetAll(limit, offset int) ([]AudioContact, error) {
	var audioContacts []AudioContact
	query := r.db.Order("created_at DESC")
	
	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}
	
	err := query.Find(&audioContacts).Error
	return audioContacts, err
}

func (r *audioContactRepository) GetByStatus(status string, limit, offset int) ([]AudioContact, error) {
	var audioContacts []AudioContact
	query := r.db.Where("status = ?", status).Order("created_at DESC")
	
	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}
	
	err := query.Find(&audioContacts).Error
	return audioContacts, err
}

func (r *audioContactRepository) Update(audioContact *AudioContact) error {
	return r.db.Save(audioContact).Error
}

func (r *audioContactRepository) UpdateStatus(id uint, status string, notes string) error {
	updates := map[string]interface{}{
		"status": status,
		"notes":  notes,
	}
	
	if status == "processed" {
		now := gorm.Expr("datetime('now')")
		updates["processed_at"] = now
	}
	
	return r.db.Model(&AudioContact{}).Where("id = ?", id).Updates(updates).Error
}

func (r *audioContactRepository) Delete(id uint) error {
	return r.db.Delete(&AudioContact{}, id).Error
}

func (r *audioContactRepository) GetCount() (int64, error) {
	var count int64
	err := r.db.Model(&AudioContact{}).Count(&count).Error
	return count, err
}

func (r *audioContactRepository) GetCountByStatus(status string) (int64, error) {
	var count int64
	err := r.db.Model(&AudioContact{}).Where("status = ?", status).Count(&count).Error
	return count, err
}
