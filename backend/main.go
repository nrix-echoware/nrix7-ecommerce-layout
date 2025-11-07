package main

import (
	"context"
	"ecommerce-backend/common/middleware"
	"ecommerce-backend/common/security"
	"ecommerce-backend/core/admin"
	"ecommerce-backend/core/analytics"
	"ecommerce-backend/core/audiocontact"
	"ecommerce-backend/core/orders"
	chat "ecommerce-backend/core/chat"
	"ecommerce-backend/core/comments"
	"ecommerce-backend/core/contactus"
	"ecommerce-backend/core/newsletter"
	"ecommerce-backend/core/products"
	"ecommerce-backend/core/users"
	"ecommerce-backend/internal/config"
	"ecommerce-backend/internal/db"
	authGrpc "ecommerce-backend/internal/grpc/auth"
	notificationsGrpc "ecommerce-backend/internal/grpc/notifications"
	// "ecommerce-backend/internal/plugin_manager"
	// orderHandlers "ecommerce-backend/internal/plugin_manager/handlers/orders"
	// productHandlers "ecommerce-backend/internal/plugin_manager/handlers/products"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/unrolled/secure"
	"google.golang.org/grpc"
	"net"
	"time"
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
    
    // Create unified auth middleware
    authMW := middleware.AuthMiddleware(userSvc)

	// Initialize gRPC auth server
	authGrpcServer := grpc.NewServer()
	authGrpcService := authGrpc.NewServer(userSvc)
	authGrpcService.Register(authGrpcServer)

	cfg := config.Get()
	grpcListener, err := net.Listen("tcp", ":"+cfg.GrpcPort)
	if err != nil {
		logrus.Fatalf("Failed to listen on gRPC port: %v", err)
	}

	go func() {
		logrus.Infof("gRPC auth server running on :%s", cfg.GrpcPort)
		if err := authGrpcServer.Serve(grpcListener); err != nil {
			logrus.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()

	// Initialize gRPC notification client - required for stateless operation
	notificationClient, err := notificationsGrpc.NewClient(cfg.RealtimeServiceAddr)
	if err != nil {
		logrus.Fatalf("Failed to connect to realtime service: %v. Backend requires realtime service to be stateless.", err)
	}
	defer notificationClient.Close()
	logrus.Info("Connected to realtime service")

	// Ping/Pong test - send 10 pings to test gRPC connection and nginx round-robin
	go func() {
		ctx := context.Background()
		logrus.Info("Starting ping/pong test (10 requests)...")
		for i := int32(1); i <= 10; i++ {
			if err := notificationClient.Ping(ctx, i); err != nil {
				logrus.Errorf("[Ping #%d] Failed: %v", i, err)
			} else {
				logrus.Infof("[Ping #%d] Success - pong received", i)
			}
			time.Sleep(100 * time.Millisecond)
		}
		logrus.Info("Ping/pong test completed")
	}()

	// Initialize Plugin Manager (disabled for now)
	// pm := plugin_manager.NewManager(100)
	// plugin_manager.AutoRegister(pm, []plugin_manager.Plugin{
	// 	orderHandlers.NewDiscordPlugin(""),
	// 	orderHandlers.NewTelegramPlugin("", ""),
	// 	productHandlers.NewDiscordPlugin(""),
	// })
	// pm.SetHooks(plugin_manager.Hooks{
	// 	BeforeEmit: func(event plugin_manager.Event) {
	// 		logrus.Infof("[PluginManager] Emitting event: %s -> %s", event.Name, event.Target)
	// 	},
	// })
	// ctx, cancel := context.WithCancel(context.Background())
	// defer cancel()
	// go pm.RunForever(ctx)

	// eventAdapter := plugin_manager.NewEventEmitterAdapter(pm)
	var eventAdapter orders.EventEmitter = nil

    // Initialize Orders module (needed for chat)
    orderRepo := orders.NewOrderRepository(db.DB)
    orderStatusRepo := orders.NewOrderStatusRepository(db.DB)

	// Initialize Chat module - stateless, uses gRPC for notifications
	sseEmitter := chat.NewGRPCEventEmitter(notificationClient)

	threadRepo := chat.NewThreadRepository(db.DB)
	messageRepo := chat.NewMessageRepository(db.DB)
	threadSvc := chat.NewThreadService(threadRepo, sseEmitter)
	messageSvc := chat.NewMessageService(messageRepo, threadRepo, orderRepo, sseEmitter)
	threadCreatorAdapter := chat.NewThreadCreatorAdapter(threadSvc)

	orderSvc := orders.NewOrderServiceWithChat(orderRepo, orderStatusRepo, productRepo, eventAdapter, sseEmitter, threadCreatorAdapter)
    orderCtrl := orders.NewController(orderSvc, authMW, productRepo, userRepo)
	
	// Chat controller - only handles business logic, no SSE routes
	chatCtrl := chat.NewChatController(threadSvc, messageSvc, orderRepo, userRepo, authMW)
	chatCtrl.RegisterRoutes(r)

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

	// Initialize Audio Contact module
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

	// Admin routes
	adminCtrl := admin.NewController(db.DB)
	r.POST("/admin/cleanup-tokens", adminCtrl.CleanupTokens)

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
