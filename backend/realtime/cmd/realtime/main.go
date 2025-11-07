package main

import (
	"context"
	"log"
	"net"
	"net/http"

	"ecommerce-realtime/internal/auth"
	"ecommerce-realtime/internal/config"
	notificationsGrpc "ecommerce-realtime/internal/grpc/notifications"
	"ecommerce-realtime/internal/handlers"
	"ecommerce-realtime/internal/hub"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

func main() {
	logrus.SetFormatter(&logrus.TextFormatter{FullTimestamp: true})
	logrus.Info("Starting Realtime microservice...")

	cfg := config.Get()
	if cfg.AdminAPIKey == "" {
		logrus.Fatal("ADMIN_API_KEY is required for realtime gRPC server")
	}

	authService, err := auth.NewService(cfg.JWTAccessSecret)
	if err != nil {
		logrus.Fatalf("Failed to initialize auth service: %v", err)
	}

	sseHub := hub.NewSSEHub()
	wsHub := hub.NewWSHub()
	go wsHub.Run()

	authMW := handlers.NewAuthMiddleware(authService)
	sseHandler := handlers.NewSSEHandler(sseHub, authMW, cfg.AdminAPIKey)
	wsHandler := handlers.NewWSHandler(wsHub, authMW, cfg.AdminAPIKey)

	notificationServer := notificationsGrpc.NewServer(sseHub, wsHub)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(requireAdminKeyUnary(cfg.AdminAPIKey)),
		grpc.StreamInterceptor(requireAdminKeyStream(cfg.AdminAPIKey)),
	)
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

func requireAdminKeyUnary(expected string) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		if !validateAdminKey(ctx, expected) {
			return nil, status.Error(codes.Unauthenticated, "invalid admin key")
		}
		return handler(ctx, req)
	}
}

func requireAdminKeyStream(expected string) grpc.StreamServerInterceptor {
	return func(srv interface{}, ss grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		if !validateAdminKey(ss.Context(), expected) {
			return status.Error(codes.Unauthenticated, "invalid admin key")
		}
		return handler(srv, ss)
	}
}

func validateAdminKey(ctx context.Context, expected string) bool {
	if expected == "" {
		return false
	}
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return false
	}
	values := md.Get("x-admin-api-key")
	if len(values) == 0 {
		return false
	}
	return values[0] == expected
}
