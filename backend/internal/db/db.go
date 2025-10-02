package db

import (
	"context"
	"ecommerce-backend/core/contactus"
	"ecommerce-backend/core/products"
	"ecommerce-backend/core/comments"
	"ecommerce-backend/core/analytics"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"github.com/sirupsen/logrus"
	"ecommerce-backend/internal/config"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open(config.Get().DBFile), &gorm.Config{})
	if err != nil {
		logrus.Fatalf("failed to connect database: %v", err)
	}
	if err := DB.AutoMigrate(&contactus.ContactUs{}); err != nil {
		logrus.Fatalf("failed to migrate database: %v", err)
	}
	if err := DB.AutoMigrate(&products.Product{}, &products.ProductImage{}, &products.ProductVariant{}, &products.CartInvalidation{}); err != nil {
		logrus.Fatalf("failed to migrate products tables: %v", err)
	}
	if err := DB.AutoMigrate(&comments.Comment{}); err != nil {
		logrus.Fatalf("failed to migrate comments tables: %v", err)
	}
	if err := DB.AutoMigrate(&analytics.VisitorEvent{}); err != nil {
		logrus.Fatalf("failed to migrate analytics tables: %v", err)
	}
	
	// Initialize cart invalidation hash if not exists
	cartInvalidationRepo := products.NewCartInvalidationRepository(DB)
	if err := cartInvalidationRepo.InitializeHash(context.Background()); err != nil {
		logrus.Warnf("failed to initialize cart invalidation hash: %v", err)
	}
}
