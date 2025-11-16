package db

import (
	"context"
	"fmt"
	"time"

	"ecommerce-backend/core/analytics"
	"ecommerce-backend/core/audiocontact"
	chat "ecommerce-backend/core/chat"
	"ecommerce-backend/core/comments"
	"ecommerce-backend/core/contactus"
	"ecommerce-backend/core/newsletter"
	"ecommerce-backend/core/orders"
	"ecommerce-backend/core/products"
	"ecommerce-backend/core/users"
	"ecommerce-backend/core/genai/tryons"
	"ecommerce-backend/internal/config"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const schemaMigrationLockID int64 = 0x4553434f4d

var DB *gorm.DB

func InitDB() {
	cfg := config.Get()

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%d sslmode=%s TimeZone=%s",
		cfg.Database.Host,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
		cfg.Database.Port,
		cfg.Database.SSLMode,
		cfg.Database.TimeZone,
	)

	pgDB, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		logrus.Fatalf("failed to connect database: %v", err)
	}

	sqlDB, err := pgDB.DB()
	if err != nil {
		logrus.Fatalf("failed to get database handle: %v", err)
	}

	if cfg.Database.MaxOpenConns > 0 {
		sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	}
	if cfg.Database.MaxIdleConns > 0 {
		sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	}
	if cfg.Database.ConnMaxMinutes > 0 {
		sqlDB.SetConnMaxLifetime(time.Duration(cfg.Database.ConnMaxMinutes) * time.Minute)
	}

	DB = pgDB
	if _, err := sqlDB.ExecContext(context.Background(), "SELECT pg_advisory_lock($1)", schemaMigrationLockID); err != nil {
		logrus.Fatalf("failed to acquire schema lock: %v", err)
	}
	defer func() {
		if _, err := sqlDB.ExecContext(context.Background(), "SELECT pg_advisory_unlock($1)", schemaMigrationLockID); err != nil {
			logrus.Warnf("failed to release schema lock: %v", err)
		}
	}()

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
	if err := DB.AutoMigrate(&chat.Thread{}, &chat.Message{}); err != nil {
		logrus.Fatalf("failed to migrate chat tables: %v", err)
	}
	if err := DB.AutoMigrate(&tryons.TryonJob{}, &tryons.TryonMedia{}); err != nil {
		logrus.Fatalf("failed to migrate tryons tables: %v", err)
	}

	// Initialize cart invalidation hash if not exists
	cartInvalidationRepo := products.NewCartInvalidationRepository(DB)
	if err := cartInvalidationRepo.InitializeHash(context.Background()); err != nil {
		logrus.Warnf("failed to initialize cart invalidation hash: %v", err)
	}
}
