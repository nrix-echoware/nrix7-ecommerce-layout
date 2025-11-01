package products

import (
	"encoding/json"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"time"
)

type Product struct {
	ID          string           `gorm:"primaryKey" json:"id"`
	Name        string           `json:"name"`
	Category    string           `json:"category"`
	Description string           `json:"description"`
	Price       int              `json:"price"` // price in smallest currency unit
	Featured    bool             `json:"featured"`
	IsActive    bool             `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time        `gorm:"autoCreateTime" json:"created_at"`
	Images      []ProductImage   `gorm:"foreignKey:ProductID" json:"images"`
	Variants    []ProductVariant `gorm:"foreignKey:ProductID" json:"variants"`
}

type ProductImage struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	ProductID string `gorm:"index" json:"product_id"`
	ImageURL  string `json:"url"`
}

type ProductVariant struct {
	ID         string         `gorm:"primaryKey" json:"id"`
	ProductID  string         `gorm:"index" json:"product_id"`
	SKU        string         `json:"sku"`
	Attributes datatypes.JSON `json:"attributes"` // e.g. [{"name": "size", "value": "M"}]
	ImageURL   string         `json:"image_url"`
	Price      int            `json:"price"`
	InStock    bool           `json:"in_stock"`
	IsActive   bool           `gorm:"default:true" json:"is_active"`
}

// Transformation pipeline for API response

type ProductResponse struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Category    string            `json:"category"`
	Description string            `json:"description"`
	Images      []string          `json:"images"`
	Price       int               `json:"price"`
	Featured    bool              `json:"featured"`
	IsActive    bool              `json:"is_active"`
	Variants    []VariantResponse `json:"variants,omitempty"`
}

type VariantResponse struct {
	ID         string            `json:"id"`
	SKU        string            `json:"sku"`
	Attributes map[string]string `json:"attributes"`
	Image      string            `json:"image"`
	Price      int               `json:"price"`
	InStock    bool              `json:"inStock"`
	IsActive   bool              `json:"is_active"`
}

func (p *Product) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return
}

func (v *ProductVariant) BeforeCreate(tx *gorm.DB) (err error) {
	if v.ID == "" {
		v.ID = uuid.New().String()
	}
	return
}

func TransformProductToResponse(product *Product) ProductResponse {
	images := make([]string, len(product.Images))
	for i, img := range product.Images {
		images[i] = img.ImageURL
	}
	activeVariants := make([]ProductVariant, 0)
	for _, v := range product.Variants {
		if v.IsActive {
			activeVariants = append(activeVariants, v)
		}
	}
	variants := make([]VariantResponse, len(activeVariants))
	for i, v := range activeVariants {
		var attrsArr []map[string]string
		attrMap := make(map[string]string)
		if len(v.Attributes) > 0 {
			_ = json.Unmarshal(v.Attributes, &attrsArr)
			for _, pair := range attrsArr {
				if name, ok := pair["name"]; ok {
					attrMap[name] = pair["value"]
				}
			}
		}
		variants[i] = VariantResponse{
			ID:         v.ID,
			SKU:        v.SKU,
			Attributes: attrMap,
			Image:      v.ImageURL,
			Price:      v.Price,
			InStock:    v.InStock,
			IsActive:   v.IsActive,
		}
	}
	return ProductResponse{
		ID:          product.ID,
		Name:        product.Name,
		Category:    product.Category,
		Description: product.Description,
		Images:      images,
		Price:       product.Price,
		Featured:    product.Featured,
		IsActive:    product.IsActive,
		Variants:    variants,
	}
}
