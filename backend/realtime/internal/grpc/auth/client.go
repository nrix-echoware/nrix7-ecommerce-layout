package auth

import (
	"context"
	"fmt"

	"ecommerce-realtime/proto/auth"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Client struct {
	conn   *grpc.ClientConn
	client auth.AuthServiceClient
}

func NewClient(addr string) (*Client, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to auth service: %w", err)
	}

	return &Client{
		conn:   conn,
		client: auth.NewAuthServiceClient(conn),
	}, nil
}

func (c *Client) Close() error {
	return c.conn.Close()
}

func (c *Client) ValidateToken(ctx context.Context, token string) (*auth.ValidateTokenResponse, error) {
	req := &auth.ValidateTokenRequest{
		Token: token,
	}
	return c.client.ValidateToken(ctx, req)
}

