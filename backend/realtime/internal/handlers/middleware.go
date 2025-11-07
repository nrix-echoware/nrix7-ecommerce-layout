package handlers

import (
	"net/http"
	"strings"

	"ecommerce-realtime/internal/grpc/auth"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthMiddleware struct {
	authService auth.Service
}

func NewAuthMiddleware(authService auth.Service) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
	}
}

func (m *AuthMiddleware) GetAuthService() auth.Service {
	return m.authService
}

func (m *AuthMiddleware) Handler() gin.HandlerFunc {
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
		}

		if tokenString == "" {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
			ctx.Abort()
			return
		}

		claims, err := m.authService.ValidateToken(ctx.Request.Context(), tokenString)
		if err != nil {
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

func AdminKeyMiddleware(adminKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		provided := c.GetHeader("X-Admin-API-Key")
		if provided == "" {
			provided = c.Query("admin_key")
		}
		if adminKey == "" || provided == "" || provided != adminKey {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Next()
	}
}

func (m *AuthMiddleware) ValidateUserID(ctx *gin.Context, userIDParam string) bool {
	userIDVal, ok := ctx.Get("user_id")
	if !ok {
		return false
	}

	userUUID, ok := userIDVal.(uuid.UUID)
	if !ok {
		return false
	}

	return userUUID.String() == userIDParam
}

func ValidateUserID(ctx *gin.Context, userIDParam string) bool {
	userIDVal, ok := ctx.Get("user_id")
	if !ok {
		return false
	}

	userUUID, ok := userIDVal.(uuid.UUID)
	if !ok {
		return false
	}

	return userUUID.String() == userIDParam
}

