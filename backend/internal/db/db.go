package db

import (
	"context"
	"ecommerce-backend/core/analytics"
	"ecommerce-backend/core/audiocontact"
	"ecommerce-backend/core/orders"
	"ecommerce-backend/core/comments"
	"ecommerce-backend/core/contactus"
	"ecommerce-backend/core/newsletter"
	"ecommerce-backend/core/products"
	"ecommerce-backend/core/users"
	"ecommerce-backend/internal/config"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open(config.Get().DBFile), &gorm.Config{})
	if err != nil {
		logrus.Fatalf("failed to connect database: %v", err)
	}
	if err := DB.AutoMigrate(&contactus.ContactUs{}, &contactus.FAQ{}); err != nil {
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
	if err := DB.AutoMigrate(&users.User{}, &users.RefreshToken{}, &users.UserSession{}, &users.PasswordResetToken{}); err != nil {
		logrus.Fatalf("failed to migrate users tables: %v", err)
	}
	if err := DB.AutoMigrate(&newsletter.NewsletterSubscription{}); err != nil {
		logrus.Fatalf("failed to migrate newsletter tables: %v", err)
	}
	if err := DB.AutoMigrate(&audiocontact.AudioContact{}); err != nil {
		logrus.Fatalf("failed to migrate audio contact tables: %v", err)
	}
	if err := DB.AutoMigrate(&orders.Order{}, &orders.OrderStatusEvent{}); err != nil {
		logrus.Fatalf("failed to migrate orders tables: %v", err)
	}

	// Initialize cart invalidation hash if not exists
	cartInvalidationRepo := products.NewCartInvalidationRepository(DB)
	if err := cartInvalidationRepo.InitializeHash(context.Background()); err != nil {
		logrus.Warnf("failed to initialize cart invalidation hash: %v", err)
	}
}
