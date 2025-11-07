package chat

import (
	"context"

	"ecommerce-backend/internal/grpc/notifications"
)

type GRPCEventEmitter struct {
	client *notifications.Client
}

func NewGRPCEventEmitter(client *notifications.Client) *GRPCEventEmitter {
	return &GRPCEventEmitter{
		client: client,
	}
}

func (e *GRPCEventEmitter) EmitAdminEvent(event interface{}) {
	eventMap, ok := event.(map[string]interface{})
	if !ok {
		return
	}

	resource, _ := eventMap["resource"].(string)
	resourceType, _ := eventMap["resource_type"].(string)
	data, _ := eventMap["data"].(map[string]interface{})

	ctx := context.Background()
	if err := e.client.SendSSEToAdmin(ctx, resource, resourceType, data); err != nil {
		// Log error but don't fail
		return
	}
}

func (e *GRPCEventEmitter) EmitUserEvent(userID string, event interface{}) {
	eventMap, ok := event.(map[string]interface{})
	if !ok {
		return
	}

	resource, _ := eventMap["resource"].(string)
	resourceType, _ := eventMap["resource_type"].(string)
	data, _ := eventMap["data"].(map[string]interface{})

	ctx := context.Background()
	if err := e.client.SendSSEToUser(ctx, userID, resource, resourceType, data); err != nil {
		// Log error but don't fail
		return
	}
}

