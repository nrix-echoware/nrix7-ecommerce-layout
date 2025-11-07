package main

import (
	"log"
	"net"
	"net/http"

	"ecommerce-realtime/internal/config"
	"ecommerce-realtime/internal/grpc/auth"
	notificationsGrpc "ecommerce-realtime/internal/grpc/notifications"
	"ecommerce-realtime/internal/handlers"
	"ecommerce-realtime/internal/hub"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
)

func main() {
	logrus.SetFormatter(&logrus.TextFormatter{FullTimestamp: true})
	logrus.Info("Starting Realtime microservice...")

	cfg := config.Get()

	authClient, err := auth.NewClient(cfg.AuthServiceAddr)
	if err != nil {
		logrus.Fatalf("Failed to connect to auth service: %v", err)
	}
	defer authClient.Close()

	authService := auth.NewService(authClient)

	sseHub := hub.NewSSEHub()
	wsHub := hub.NewWSHub()
	go wsHub.Run()

	authMW := handlers.NewAuthMiddleware(authService)
	sseHandler := handlers.NewSSEHandler(sseHub, authMW, cfg.AdminAPIKey)
	wsHandler := handlers.NewWSHandler(wsHub, authMW, cfg.AdminAPIKey)

	notificationServer := notificationsGrpc.NewServer(sseHub, wsHub)

	grpcServer := grpc.NewServer()
	notificationServer.Register(grpcServer)

	grpcListener, err := net.Listen("tcp", ":"+cfg.GrpcPort)
	if err != nil {
		logrus.Fatalf("Failed to listen on gRPC port: %v", err)
	}

	go func() {
		logrus.Infof("gRPC server running on :%s", cfg.GrpcPort)
		if err := grpcServer.Serve(grpcListener); err != nil {
			logrus.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()

	r := gin.Default()

	corsCfg := cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Admin-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
	}
	r.Use(cors.New(corsCfg))

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.HEAD("/healthz", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	api := r.Group("/api")
	sseHandler.RegisterRoutes(api)
	wsHandler.RegisterRoutes(api)

	logrus.Infof("HTTP server running on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
