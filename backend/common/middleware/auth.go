package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"ecommerce-backend/core/users"
	"ecommerce-backend/internal/config"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(userService users.UserService) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var tokenString string
		
		authHeader := ctx.GetHeader("Authorization")
		if authHeader != "" {
			tokenParts := strings.Split(authHeader, " ")
			if len(tokenParts) == 2 && tokenParts[0] == "Bearer" {
				tokenString = tokenParts[1]
			}
		}
		
		if tokenString == "" {
			tokenString = ctx.Query("token")
			if tokenString != "" {
				if strings.Contains(ctx.Request.URL.Path, "/sse") {
					fmt.Printf("[AuthMiddleware] Using token from query parameter for SSE: %s\n", ctx.Request.URL.Path)
				}
			}
		}
		
		if tokenString == "" {
			fmt.Printf("[AuthMiddleware] No token found for path: %s\n", ctx.Request.URL.Path)
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
			ctx.Abort()
			return
		}

		claims, err := userService.ValidateToken(context.Background(), tokenString)
		if err != nil {
			fmt.Printf("[AuthMiddleware] Token validation failed for path %s: %v\n", ctx.Request.URL.Path, err)
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "details": err.Error()})
			ctx.Abort()
			return
		}

		ctx.Set("user_id", claims.UserID)
		ctx.Set("user_email", claims.Email)
		ctx.Set("user_claims", claims)
		ctx.Next()
	}
}

func AdminKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		expected := config.Get().AdminAPIKey
		provided := c.GetHeader("X-Admin-API-Key")
		if provided == "" {
			provided = c.Query("admin_key")
		}
		if expected == "" || provided == "" || provided != expected {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Next()
	}
}

