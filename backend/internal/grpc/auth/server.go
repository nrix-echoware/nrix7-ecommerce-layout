package auth

import (
	"context"

	"ecommerce-backend/core/users"
	"ecommerce-backend/proto/auth"
	"google.golang.org/grpc"
)

type Server struct {
	auth.UnimplementedAuthServiceServer
	userService users.UserService
}

func NewServer(userService users.UserService) *Server {
	return &Server{
		userService: userService,
	}
}

func (s *Server) Register(grpcServer *grpc.Server) {
	auth.RegisterAuthServiceServer(grpcServer, s)
}

func (s *Server) ValidateToken(ctx context.Context, req *auth.ValidateTokenRequest) (*auth.ValidateTokenResponse, error) {
	claims, err := s.userService.ValidateToken(ctx, req.Token)
	if err != nil {
		return &auth.ValidateTokenResponse{
			Valid: false,
			Error: err.Error(),
		}, nil
	}

	return &auth.ValidateTokenResponse{
		Valid:     true,
		UserId:     claims.UserID.String(),
		Email:      claims.Email,
		FirstName:  claims.FirstName,
		LastName:   claims.LastName,
	}, nil
}

