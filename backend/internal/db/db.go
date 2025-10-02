package db

import (
	"github.com/yourorg/contactus-microservice/core/contactus"
	"github.com/yourorg/contactus-microservice/core/products"
	"github.com/yourorg/contactus-microservice/core/comments"
	"github.com/yourorg/contactus-microservice/core/analytics"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"github.com/sirupsen/logrus"
	"github.com/yourorg/contactus-microservice/internal/config"
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
	if err := DB.AutoMigrate(&products.Product{}, &products.ProductImage{}, &products.ProductVariant{}); err != nil {
		logrus.Fatalf("failed to migrate products tables: %v", err)
	}
	if err := DB.AutoMigrate(&comments.Comment{}); err != nil {
		logrus.Fatalf("failed to migrate comments tables: %v", err)
	}
	if err := DB.AutoMigrate(&analytics.VisitorEvent{}); err != nil {
		logrus.Fatalf("failed to migrate analytics tables: %v", err)
	}
}
