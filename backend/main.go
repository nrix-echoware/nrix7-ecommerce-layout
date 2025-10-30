package main

import (
	"ecommerce-backend/common/security"
	"ecommerce-backend/core/analytics"
	"ecommerce-backend/core/audiocontact"
	"ecommerce-backend/core/orders"
	"ecommerce-backend/core/comments"
	"ecommerce-backend/core/contactus"
	"ecommerce-backend/core/newsletter"
	"ecommerce-backend/core/products"
	"ecommerce-backend/core/users"
	"ecommerce-backend/core/websocket"
	"ecommerce-backend/internal/config"
	"ecommerce-backend/internal/db"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/unrolled/secure"
)

func main() {
	// Initialize logger
	logrus.SetFormatter(&logrus.TextFormatter{FullTimestamp: true})
	logrus.Info("Starting ContactUs microservice...")

	// Initialize DB
	db.InitDB()

	// Setup Gin
	r := gin.Default()

	corsCfg := cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Admin-API-Key", "ngrok-skip-browser-warning"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
	}
	r.Use(cors.New(corsCfg))

	secureMiddleware := secure.New(secure.Options{
		FrameDeny:          true,
		ContentTypeNosniff: true,
		BrowserXssFilter:   true,
		IsDevelopment:      true,
	})
	r.Use(func(c *gin.Context) {
		if err := secureMiddleware.Process(c.Writer, c.Request); err != nil {
			c.AbortWithStatus(400)
			return
		}
		c.Next()
	})

	// Dependency injection
	repo := contactus.NewContactUsRepository(db.DB)
	svc := contactus.NewContactUsService(repo)
	ctrl := contactus.NewContactUsController(svc)

	productRepo := products.NewProductRepository(db.DB)
	cartInvalidationRepo := products.NewCartInvalidationRepository(db.DB)
	productSvc := products.NewProductService(productRepo, cartInvalidationRepo)
	productCtrl := products.NewProductController(productSvc)

    // Initialize Users module (before orders to inject auth)
    userRepo := users.NewUserRepository(db.DB)
    userSvc := users.NewUserService(userRepo)
    userCtrl := users.NewUserController(userSvc)

    // Initialize Orders module
    orderRepo := orders.NewOrderRepository(db.DB)
    orderStatusRepo := orders.NewOrderStatusRepository(db.DB)
    orderSvc := orders.NewOrderService(orderRepo, orderStatusRepo, productRepo)
    orderCtrl := orders.NewController(orderSvc, userCtrl.AuthMiddleware())

	// Initialize Comment Rate Limiter (3 comments per 5 hours per IP)
	commentRateLimiter := security.NewCommentRateLimiter(db.DB)
	defer commentRateLimiter.Stop() // Cleanup on shutdown

	commentRepo := comments.NewCommentRepository(db.DB)
	commentSvc := comments.NewCommentService(commentRepo)
	commentCtrl := comments.NewCommentController(commentSvc, commentRateLimiter)

	analyticsRepo := analytics.NewRepository(db.DB)
	analyticsSvc := analytics.NewService(analyticsRepo)
	analyticsCtrl := analytics.NewController(analyticsSvc)

    // Users already initialized above

	// Initialize Newsletter module
	newsletterRepo := newsletter.NewNewsletterRepository(db.DB)
	newsletterSvc := newsletter.NewNewsletterService(newsletterRepo)
	newsletterCtrl := newsletter.NewNewsletterController(newsletterSvc)

	// Initialize WebSocket module
	wsHub := websocket.NewHub()
	wsCtrl := websocket.NewWebSocketController(wsHub)
	
	// Start WebSocket hub in a goroutine
	go wsHub.Run()

	// Initialize Audio Contact module
	cfg := config.Get()
	audioContactRepo := audiocontact.NewAudioContactRepository(db.DB)
	audioConfig := &audiocontact.AudioConfig{
		StoragePath: cfg.AudioStorage.Path,
		BaseURL:     cfg.AudioStorage.BaseURL,
	}
	audioContactSvc := audiocontact.NewAudioContactService(audioContactRepo, audioConfig)
	audioContactCtrl := audiocontact.NewAudioContactController(audioContactSvc)

	// Health check
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Rate limiting middleware for contactus
	r.Use(contactus.RateLimitMiddleware(ctrl.Name()))

	// Rate limiting middleware for products
	r.Use(contactus.RateLimitMiddleware(productCtrl.Name()))

	// Rate limiting middleware for audio contact
	r.Use(contactus.RateLimitMiddleware("audiocontact"))

	ctrl.RegisterRoutes(r)
	productCtrl.RegisterRoutes(r)
	orderCtrl.RegisterRoutes(r)
	commentCtrl.RegisterRoutes(r)
	analyticsCtrl.RegisterRoutes(r)
	userCtrl.RegisterRoutes(r)
	newsletterCtrl.RegisterRoutes(r)
	wsCtrl.RegisterRoutes(r)
	
	// Register audio contact routes
	audioContactCtrl.RegisterRoutes(r)

	// Start server
	logrus.Info("Server running on :9997")
	// if err := r.RunTLS(":9997", "cert/cert.pem", "cert/key.pem"); err != nil {
	// 	logrus.Fatal(err)
	// }
	if err := r.Run(":9997"); err != nil {
		logrus.Fatal(err)
	}
}
