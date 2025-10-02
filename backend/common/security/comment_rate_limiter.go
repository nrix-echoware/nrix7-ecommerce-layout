package security

import (
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// CommentAttempt tracks comment attempts by IP
type CommentAttempt struct {
	ID        uint      `gorm:"primaryKey"`
	IP        string    `gorm:"index;not null"`
	Timestamp time.Time `gorm:"not null"`
	ProductID string    `gorm:"index"`
	Email     string    `gorm:"index"`
	Success   bool      `gorm:"default:false"`
	Reason    string    // blocked reason if any
}

// CommentRateLimiter enforces strict rate limiting for comments
type CommentRateLimiter struct {
	db             *gorm.DB
	mu             sync.RWMutex
	maxAttempts    int           // 3 comments
	timeWindow     time.Duration // 5 hours
	cleanupTicker  *time.Ticker
	stopCleanup    chan bool
}

// RateLimitResult contains the result of rate limit check
type RateLimitResult struct {
	Allowed       bool
	Reason        string
	AttemptsCount int
	NextAvailable time.Time
}

// NewCommentRateLimiter creates a new strict comment rate limiter
func NewCommentRateLimiter(db *gorm.DB) *CommentRateLimiter {
	limiter := &CommentRateLimiter{
		db:          db,
		maxAttempts: 3,
		timeWindow:  5 * time.Hour,
		stopCleanup: make(chan bool),
	}

	// Auto-migrate the table
	if err := db.AutoMigrate(&CommentAttempt{}); err != nil {
		logrus.Errorf("Failed to migrate CommentAttempt table: %v", err)
	}

	// Start cleanup goroutine to remove old entries
	limiter.startCleanup()

	return limiter
}

// CheckAndLog checks if IP can post comment and logs the attempt
func (rl *CommentRateLimiter) CheckAndLog(ip, productID, email string) RateLimitResult {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.timeWindow)

	// Count recent attempts from this IP in the time window
	var count int64
	err := rl.db.Model(&CommentAttempt{}).
		Where("ip = ? AND timestamp > ? AND success = ?", ip, cutoff, true).
		Count(&count).Error

	if err != nil {
		logrus.Errorf("Failed to count comment attempts for IP %s: %v", ip, err)
		// Allow on error to not break functionality
		return RateLimitResult{
			Allowed: true,
			Reason:  "rate limit check failed",
		}
	}

	result := RateLimitResult{
		AttemptsCount: int(count),
	}

	// Check if limit exceeded
	if count >= int64(rl.maxAttempts) {
		// Find the oldest successful attempt to calculate when they can comment again
		var oldestAttempt CommentAttempt
		err := rl.db.Where("ip = ? AND timestamp > ? AND success = ?", ip, cutoff, true).
			Order("timestamp ASC").
			First(&oldestAttempt).Error

		if err == nil {
			result.NextAvailable = oldestAttempt.Timestamp.Add(rl.timeWindow)
		}

		result.Allowed = false
		result.Reason = fmt.Sprintf("Rate limit exceeded: %d comments in %v. Try again after %v",
			rl.maxAttempts, rl.timeWindow, result.NextAvailable.Format(time.RFC3339))

		// Log blocked attempt
		rl.logAttempt(ip, productID, email, false, result.Reason)

		logrus.Warnf("RATE LIMIT BLOCKED: IP=%s, Attempts=%d/%d, Email=%s, NextAvailable=%v",
			ip, count, rl.maxAttempts, email, result.NextAvailable)

		return result
	}

	result.Allowed = true
	result.Reason = "within rate limit"

	return result
}

// LogSuccess logs a successful comment post
func (rl *CommentRateLimiter) LogSuccess(ip, productID, email string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	rl.logAttempt(ip, productID, email, true, "success")

	// Get current count for logging
	now := time.Now()
	cutoff := now.Add(-rl.timeWindow)
	var count int64
	rl.db.Model(&CommentAttempt{}).
		Where("ip = ? AND timestamp > ? AND success = ?", ip, cutoff, true).
		Count(&count)

	logrus.Infof("COMMENT SUCCESS: IP=%s, Email=%s, Count=%d/%d in %v",
		ip, email, count, rl.maxAttempts, rl.timeWindow)
}

// logAttempt internal method to log attempt
func (rl *CommentRateLimiter) logAttempt(ip, productID, email string, success bool, reason string) {
	attempt := CommentAttempt{
		IP:        ip,
		Timestamp: time.Now(),
		ProductID: productID,
		Email:     email,
		Success:   success,
		Reason:    reason,
	}

	if err := rl.db.Create(&attempt).Error; err != nil {
		logrus.Errorf("Failed to log comment attempt: %v", err)
	}
}

// GetIPStats returns statistics for an IP
func (rl *CommentRateLimiter) GetIPStats(ip string) map[string]interface{} {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	now := time.Now()
	cutoff := now.Add(-rl.timeWindow)

	var successCount, blockedCount int64

	rl.db.Model(&CommentAttempt{}).
		Where("ip = ? AND timestamp > ? AND success = ?", ip, cutoff, true).
		Count(&successCount)

	rl.db.Model(&CommentAttempt{}).
		Where("ip = ? AND timestamp > ? AND success = ?", ip, cutoff, false).
		Count(&blockedCount)

	return map[string]interface{}{
		"ip":             ip,
		"success_count":  successCount,
		"blocked_count":  blockedCount,
		"limit":          rl.maxAttempts,
		"window":         rl.timeWindow.String(),
		"remaining":      rl.maxAttempts - int(successCount),
		"window_expires": now.Add(rl.timeWindow),
	}
}

// startCleanup starts a background goroutine to clean old entries
func (rl *CommentRateLimiter) startCleanup() {
	rl.cleanupTicker = time.NewTicker(1 * time.Hour)

	go func() {
		for {
			select {
			case <-rl.cleanupTicker.C:
				rl.cleanup()
			case <-rl.stopCleanup:
				rl.cleanupTicker.Stop()
				return
			}
		}
	}()
}

// cleanup removes entries older than 2x the time window
func (rl *CommentRateLimiter) cleanup() {
	cutoff := time.Now().Add(-2 * rl.timeWindow)

	result := rl.db.Where("timestamp < ?", cutoff).Delete(&CommentAttempt{})
	if result.Error != nil {
		logrus.Errorf("Failed to cleanup old comment attempts: %v", result.Error)
	} else if result.RowsAffected > 0 {
		logrus.Infof("Cleaned up %d old comment attempt records", result.RowsAffected)
	}
}

// Stop stops the cleanup goroutine
func (rl *CommentRateLimiter) Stop() {
	if rl.stopCleanup != nil {
		close(rl.stopCleanup)
	}
}
