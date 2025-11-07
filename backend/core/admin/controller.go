package admin

import (
	"context"
	"ecommerce-backend/core/users"
	"ecommerce-backend/internal/config"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"time"
)

type Controller struct {
	db *gorm.DB
}

func NewController(db *gorm.DB) *Controller {
	return &Controller{db: db}
}

func (ctrl *Controller) CleanupTokens(c *gin.Context) {
	adminKey := c.GetHeader("X-Admin-API-Key")
	cfg := config.Get()
	
	if adminKey == "" || adminKey != cfg.AdminAPIKey {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}

	ctx := context.Background()
	deleted := gin.H{}

	// Clean up expired tokens
	result := ctrl.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Delete(&users.RefreshToken{})
	if result.Error != nil {
		c.JSON(500, gin.H{"error": result.Error.Error()})
		return
	}
	deleted["expired"] = result.RowsAffected

	// Clean up inactive tokens that are also expired
	result = ctrl.db.WithContext(ctx).Where("is_active = ? AND expires_at < ?", false, time.Now()).Delete(&users.RefreshToken{})
	if result.Error != nil {
		c.JSON(500, gin.H{"error": result.Error.Error()})
		return
	}
	deleted["inactive_expired"] = result.RowsAffected

	// Find and remove duplicate tokens
	var duplicates []struct {
		Token  string
		Count  int64
		UserID string
	}
	
	err := ctrl.db.WithContext(ctx).Model(&users.RefreshToken{}).
		Select("token, COUNT(*) as count, user_id").
		Group("token").
		Having("COUNT(*) > 1").
		Scan(&duplicates).Error
	
	duplicateCount := int64(0)
	if err == nil && len(duplicates) > 0 {
		for _, dup := range duplicates {
			var tokens []users.RefreshToken
			err = ctrl.db.WithContext(ctx).Where("token = ?", dup.Token).Order("created_at DESC").Find(&tokens).Error
			if err == nil && len(tokens) > 1 {
				for i := 1; i < len(tokens); i++ {
					err = ctrl.db.WithContext(ctx).Delete(&tokens[i]).Error
					if err == nil {
						duplicateCount++
					}
				}
			}
		}
	}
	deleted["duplicates"] = duplicateCount

	// Get current statistics
	var totalTokens, activeTokens, expiredTokens int64
	ctrl.db.WithContext(ctx).Model(&users.RefreshToken{}).Count(&totalTokens)
	ctrl.db.WithContext(ctx).Model(&users.RefreshToken{}).Where("is_active = ?", true).Count(&activeTokens)
	ctrl.db.WithContext(ctx).Model(&users.RefreshToken{}).Where("expires_at < ?", time.Now()).Count(&expiredTokens)

	stats := gin.H{
		"success": true,
		"deleted": deleted,
		"statistics": gin.H{
			"total":   totalTokens,
			"active":  activeTokens,
			"expired": expiredTokens,
		},
	}

	c.JSON(200, stats)
}

