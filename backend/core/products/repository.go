package products

import (
	"context"
	"gorm.io/gorm"
)

type ProductRepository interface {
	Create(ctx context.Context, product *Product) error
	Update(ctx context.Context, product *Product) error
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*Product, error)
	PaginatedList(ctx context.Context, skip, take int) ([]Product, int64, error)
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) Create(ctx context.Context, product *Product) error {
	return r.db.WithContext(ctx).Create(product).Error
}

func (r *productRepository) Update(ctx context.Context, product *Product) error {
	// Use map to explicitly update boolean fields even when false
	// GORM's Updates() with struct skips zero values, so we use map instead
	err := r.db.WithContext(ctx).Model(&Product{}).
		Where("id = ?", product.ID).
		Updates(map[string]interface{}{
			"name":        product.Name,
			"category":    product.Category,
			"description": product.Description,
			"price":       product.Price,
			"featured":    product.Featured,
			"is_active":   product.IsActive,
		}).Error
	if err != nil {
		return err
	}
	
	// Update Images
	err = r.db.WithContext(ctx).Where("product_id = ?", product.ID).Delete(&ProductImage{}).Error
	if err != nil {
		return err
	}
	for _, img := range product.Images {
		img.ProductID = product.ID
		err = r.db.WithContext(ctx).Create(&img).Error
		if err != nil {
			return err
		}
	}
	
	// Update Variants - delete existing and recreate to handle updates properly
	err = r.db.WithContext(ctx).Where("product_id = ?", product.ID).Delete(&ProductVariant{}).Error
	if err != nil {
		return err
	}
	for _, variant := range product.Variants {
		variant.ProductID = product.ID
		err = r.db.WithContext(ctx).Create(&variant).Error
		if err != nil {
			return err
		}
	}
	
	return nil
}

func (r *productRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&Product{}).Error
}

func (r *productRepository) GetByID(ctx context.Context, id string) (*Product, error) {
	var product Product
	err := r.db.WithContext(ctx).Preload("Images").Preload("Variants").First(&product, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) PaginatedList(ctx context.Context, skip, take int) ([]Product, int64, error) {
	var products []Product
	var count int64
	db := r.db.WithContext(ctx).Model(&Product{})
	db.Count(&count)
	err := db.Preload("Images").Preload("Variants").Offset(skip).Limit(take).Find(&products).Error
	if err != nil {
		return nil, 0, err
	}
	return products, count, nil
}
