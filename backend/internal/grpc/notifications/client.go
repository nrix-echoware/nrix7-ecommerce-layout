package notifications

import (
	"context"
	"encoding/json"
	"fmt"

	"ecommerce-backend/proto/notifications"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Client struct {
	conn   *grpc.ClientConn
	client notifications.NotificationServiceClient
}

func NewClient(addr string) (*Client, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to notification service: %w", err)
	}

	return &Client{
		conn:   conn,
		client: notifications.NewNotificationServiceClient(conn),
	}, nil
}

func (c *Client) Close() error {
	return c.conn.Close()
}

func (c *Client) SendSSEToAdmin(ctx context.Context, resource, resourceType string, data map[string]interface{}) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	req := &notifications.SSEAdminEvent{
		Resource:     resource,
		ResourceType: resourceType,
		DataJson:     string(dataJSON),
	}

	resp, err := c.client.SendSSEToAdmin(ctx, req)
	if err != nil {
		return err
	}

	if !resp.Success {
		return fmt.Errorf("notification failed: %s", resp.Error)
	}

	return nil
}

func (c *Client) SendSSEToUser(ctx context.Context, userID, resource, resourceType string, data map[string]interface{}) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	req := &notifications.SSEUserEvent{
		UserId:       userID,
		Resource:     resource,
		ResourceType: resourceType,
		DataJson:     string(dataJSON),
	}

	resp, err := c.client.SendSSEToUser(ctx, req)
	if err != nil {
		return err
	}

	if !resp.Success {
		return fmt.Errorf("notification failed: %s", resp.Error)
	}

	return nil
}

func (c *Client) SendWebSocketToAdmin(ctx context.Context, msgType string, data interface{}) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	req := &notifications.WSAdminEvent{
		Type:     msgType,
		DataJson: string(dataJSON),
	}

	resp, err := c.client.SendWebSocketToAdmin(ctx, req)
	if err != nil {
		return err
	}

	if !resp.Success {
		return fmt.Errorf("notification failed: %s", resp.Error)
	}

	return nil
}

func (c *Client) SendWebSocketToUser(ctx context.Context, userID, msgType string, data interface{}) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	req := &notifications.WSUserEvent{
		UserId:   userID,
		Type:     msgType,
		DataJson: string(dataJSON),
	}

	resp, err := c.client.SendWebSocketToUser(ctx, req)
	if err != nil {
		return err
	}

	if !resp.Success {
		return fmt.Errorf("notification failed: %s", resp.Error)
	}

	return nil
}

func (c *Client) BroadcastWebSocket(ctx context.Context, msgType string, data interface{}) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	req := &notifications.WSBroadcastEvent{
		Type:     msgType,
		DataJson: string(dataJSON),
	}

	resp, err := c.client.BroadcastWebSocket(ctx, req)
	if err != nil {
		return err
	}

	if !resp.Success {
		return fmt.Errorf("notification failed: %s", resp.Error)
	}

	return nil
}

func (c *Client) Ping(ctx context.Context, sequence int32) error {
	req := &notifications.PingRequest{
		Message:  "ping",
		Sequence: sequence,
	}

	resp, err := c.client.Ping(ctx, req)
	if err != nil {
		return err
	}

	if !resp.Success {
		return fmt.Errorf("ping failed: sequence %d", sequence)
	}

	return nil
}

