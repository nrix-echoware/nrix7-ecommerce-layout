package notifications

import (
	"context"
	"encoding/json"
	"log"

	"ecommerce-realtime/internal/hub"
	"ecommerce-realtime/proto/notifications"
	"google.golang.org/grpc"
)

type Server struct {
	notifications.UnimplementedNotificationServiceServer
	sseHub *hub.SSEHub
	wsHub  *hub.WSHub
}

func NewServer(sseHub *hub.SSEHub, wsHub *hub.WSHub) *Server {
	return &Server{
		sseHub: sseHub,
		wsHub:  wsHub,
	}
}

func (s *Server) Register(grpcServer *grpc.Server) {
	notifications.RegisterNotificationServiceServer(grpcServer, s)
}

func (s *Server) SendSSEToAdmin(ctx context.Context, req *notifications.SSEAdminEvent) (*notifications.SSEResponse, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(req.DataJson), &data); err != nil {
		log.Printf("Error unmarshaling SSE data: %v", err)
		return &notifications.SSEResponse{
			Success: false,
			Error:   err.Error(),
		}, nil
	}

	msg := hub.SSEMessage{
		Resource:     req.Resource,
		ResourceType: req.ResourceType,
		Data:         data,
	}

	s.sseHub.BroadcastToAdmin(msg)
	return &notifications.SSEResponse{Success: true}, nil
}

func (s *Server) SendSSEToUser(ctx context.Context, req *notifications.SSEUserEvent) (*notifications.SSEResponse, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(req.DataJson), &data); err != nil {
		log.Printf("Error unmarshaling SSE data: %v", err)
		return &notifications.SSEResponse{
			Success: false,
			Error:   err.Error(),
		}, nil
	}

	msg := hub.SSEMessage{
		Resource:     req.Resource,
		ResourceType: req.ResourceType,
		Data:         data,
	}

	s.sseHub.BroadcastToUser(req.UserId, msg)
	return &notifications.SSEResponse{Success: true}, nil
}

func (s *Server) SendWebSocketToAdmin(ctx context.Context, req *notifications.WSAdminEvent) (*notifications.WSResponse, error) {
	var data interface{}
	if err := json.Unmarshal([]byte(req.DataJson), &data); err != nil {
		log.Printf("Error unmarshaling WS data: %v", err)
		return &notifications.WSResponse{
			Success: false,
			Error:   err.Error(),
		}, nil
	}

	msg := hub.WSMessage{
		Type:      req.Type,
		Data:      data,
		Timestamp: hub.GetCurrentTime(),
	}

	s.wsHub.SendToAdmin(msg)
	return &notifications.WSResponse{Success: true}, nil
}

func (s *Server) SendWebSocketToUser(ctx context.Context, req *notifications.WSUserEvent) (*notifications.WSResponse, error) {
	var data interface{}
	if err := json.Unmarshal([]byte(req.DataJson), &data); err != nil {
		log.Printf("Error unmarshaling WS data: %v", err)
		return &notifications.WSResponse{
			Success: false,
			Error:   err.Error(),
		}, nil
	}

	msg := hub.WSMessage{
		Type:      req.Type,
		Data:      data,
		Timestamp: hub.GetCurrentTime(),
	}

	s.wsHub.SendToUser(req.UserId, msg)
	return &notifications.WSResponse{Success: true}, nil
}

func (s *Server) BroadcastWebSocket(ctx context.Context, req *notifications.WSBroadcastEvent) (*notifications.WSResponse, error) {
	var data interface{}
	if err := json.Unmarshal([]byte(req.DataJson), &data); err != nil {
		log.Printf("Error unmarshaling WS data: %v", err)
		return &notifications.WSResponse{
			Success: false,
			Error:   err.Error(),
		}, nil
	}

	msg := hub.WSMessage{
		Type:      req.Type,
		Data:      data,
		Timestamp: hub.GetCurrentTime(),
	}

	s.wsHub.Broadcast(msg)
	return &notifications.WSResponse{Success: true}, nil
}

func (s *Server) Ping(ctx context.Context, req *notifications.PingRequest) (*notifications.PongResponse, error) {
	log.Printf("[Realtime] Received Ping #%d: %s", req.Sequence, req.Message)
	return &notifications.PongResponse{
		Message:  "pong",
		Sequence: req.Sequence,
		Success:  true,
	}, nil
}

