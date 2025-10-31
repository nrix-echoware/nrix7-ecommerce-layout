package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"ecommerce-backend/core/users"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	// Get database path from environment - required
	dbPath := os.Getenv("DB_FILE")
	if dbPath == "" {
		log.Fatal("Failed to start: DB_FILE environment variable is required")
	}

	// Connect to database
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	ctx := context.Background()

	// Clean up expired tokens
	fmt.Println("Cleaning up expired tokens...")
	result := db.WithContext(ctx).Where("expires_at < ?", time.Now()).Delete(&users.RefreshToken{})
	if result.Error != nil {
		log.Printf("Error cleaning up expired tokens: %v", result.Error)
	} else {
		fmt.Printf("Deleted %d expired tokens\n", result.RowsAffected)
	}

	// Clean up inactive tokens that are also expired
	fmt.Println("Cleaning up inactive expired tokens...")
	result = db.WithContext(ctx).Where("is_active = ? AND expires_at < ?", false, time.Now()).Delete(&users.RefreshToken{})
	if result.Error != nil {
		log.Printf("Error cleaning up inactive tokens: %v", result.Error)
	} else {
		fmt.Printf("Deleted %d inactive expired tokens\n", result.RowsAffected)
	}

	// Find and report duplicate tokens
	fmt.Println("Checking for duplicate tokens...")
	var duplicates []struct {
		Token  string
		Count  int64
		UserID string
	}
	
	err = db.WithContext(ctx).Model(&users.RefreshToken{}).
		Select("token, COUNT(*) as count, user_id").
		Group("token").
		Having("COUNT(*) > 1").
		Scan(&duplicates).Error
	
	if err != nil {
		log.Printf("Error checking for duplicates: %v", err)
	} else if len(duplicates) > 0 {
		fmt.Printf("Found %d duplicate tokens:\n", len(duplicates))
		for _, dup := range duplicates {
			fmt.Printf("  Token: %s (User: %s, Count: %d)\n", dup.Token[:20]+"...", dup.UserID, dup.Count)
		}
		
		// Remove duplicates, keeping only the most recent one
		for _, dup := range duplicates {
			var tokens []users.RefreshToken
			err = db.WithContext(ctx).Where("token = ?", dup.Token).Order("created_at DESC").Find(&tokens).Error
			if err != nil {
				log.Printf("Error finding tokens for cleanup: %v", err)
				continue
			}
			
			// Keep the first (most recent) token, delete the rest
			if len(tokens) > 1 {
				for i := 1; i < len(tokens); i++ {
					err = db.WithContext(ctx).Delete(&tokens[i]).Error
					if err != nil {
						log.Printf("Error deleting duplicate token: %v", err)
					} else {
						fmt.Printf("  Deleted duplicate token for user %s\n", dup.UserID)
					}
				}
			}
		}
	} else {
		fmt.Println("No duplicate tokens found")
	}

	// Report current token statistics
	var totalTokens, activeTokens, expiredTokens int64
	
	db.WithContext(ctx).Model(&users.RefreshToken{}).Count(&totalTokens)
	db.WithContext(ctx).Model(&users.RefreshToken{}).Where("is_active = ?", true).Count(&activeTokens)
	db.WithContext(ctx).Model(&users.RefreshToken{}).Where("expires_at < ?", time.Now()).Count(&expiredTokens)
	
	fmt.Printf("\nToken Statistics:\n")
	fmt.Printf("  Total tokens: %d\n", totalTokens)
	fmt.Printf("  Active tokens: %d\n", activeTokens)
	fmt.Printf("  Expired tokens: %d\n", expiredTokens)
	
	fmt.Println("\nCleanup completed successfully!")
}
