package contactus

import (
	"ecommerce-backend/internal/config"
	"github.com/gin-gonic/gin"
	"net"
	"sync"
	"time"
)

type rateLimiter struct {
	mu        sync.Mutex
	visitors  map[string]*visitor
	limitPost int
	limitGet  int
	window    time.Duration
}

type visitor struct {
	lastSeen time.Time
	post     *tokenBucket
	get      *tokenBucket
}

type tokenBucket struct {
	capacity int
	tokens   int
	last     time.Time
}

func newTokenBucket(capacity int, refillInterval time.Duration) *tokenBucket {
	return &tokenBucket{
		capacity: capacity,
		tokens:   capacity,
		last:     time.Now(),
	}
}

func (b *tokenBucket) allow(refillInterval time.Duration) bool {
	now := time.Now()
	elapsed := now.Sub(b.last)
	refills := int(elapsed / refillInterval)
	if refills > 0 {
		b.tokens += refills
		if b.tokens > b.capacity {
			b.tokens = b.capacity
		}
		b.last = now
	}
	if b.tokens > 0 {
		b.tokens--
		return true
	}
	return false
}

func newRateLimiter(limitPost, limitGet int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		visitors:  make(map[string]*visitor),
		limitPost: limitPost,
		limitGet:  limitGet,
		window:    window,
	}
}

func (rl *rateLimiter) getVisitor(ip string) *visitor {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	v, exists := rl.visitors[ip]
	if !exists {
		v = &visitor{
			lastSeen: time.Now(),
			post:     newTokenBucket(rl.limitPost, rl.window),
			get:      newTokenBucket(rl.limitGet, rl.window),
		}
		rl.visitors[ip] = v
	}
	v.lastSeen = time.Now()
	return v
}

func RateLimitMiddleware(controllerName string) gin.HandlerFunc {
	cfg := config.Get()
	setting, ok := cfg.RateLimit.Controllers[controllerName]
	if !ok {
		setting = cfg.RateLimit.Default
	}
	limiter := newRateLimiter(setting.Post, setting.Get, time.Minute)
    // path prefixes to scope limiter to this controller only
    var prefixes []string
    switch controllerName {
    case "contactus":
        prefixes = []string{"/contactus"}
    case "products":
        prefixes = []string{"/products"}
    case "audiocontact":
        prefixes = []string{"/api/audio-contact", "/api/audio", "/api/admin/audio-contacts"}
    default:
        // If unknown, apply to all paths (fallback)
        prefixes = nil
    }
	// Clean up old visitors periodically
	go func() {
		for {
			time.Sleep(time.Minute)
			limiter.mu.Lock()
			for ip, v := range limiter.visitors {
				if time.Since(v.lastSeen) > 2*time.Minute {
					delete(limiter.visitors, ip)
				}
			}
			limiter.mu.Unlock()
		}
	}()
    return func(c *gin.Context) {
        // If prefixes specified, only enforce for matching paths
        if len(prefixes) > 0 {
            path := c.Request.URL.Path
            matched := false
            for _, p := range prefixes {
                if len(path) >= len(p) && path[:len(p)] == p {
                    matched = true
                    break
                }
            }
            if !matched {
                c.Next()
                return
            }
        }
		ip := clientIP(c)
		v := limiter.getVisitor(ip)
		var allowed bool
		if c.Request.Method == "POST" {
			allowed = v.post.allow(time.Minute)
		} else if c.Request.Method == "GET" {
			allowed = v.get.allow(time.Minute)
		} else {
			allowed = true
		}
		if !allowed {
			c.AbortWithStatusJSON(429, gin.H{"error": "rate limit exceeded"})
			return
		}
		c.Next()
	}
}

func clientIP(c *gin.Context) string {
	ip := c.ClientIP()
	if ip == "" {
		ip, _, _ = net.SplitHostPort(c.Request.RemoteAddr)
	}
	return ip
}
