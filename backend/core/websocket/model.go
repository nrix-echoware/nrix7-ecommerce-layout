package websocket

import (
	"io"
	"time"

	"github.com/google/uuid"
)

// Client represents a WebSocket client connection
type Client struct {
	ID       string    `json:"id"`
	Email    string    `json:"email,omitempty"`    // For logged-in users
	SessionID string   `json:"session_id,omitempty"` // For anonymous users
	IsAdmin  bool      `json:"is_admin"`
	Conn     WebSocketConnection `json:"-"`
	Send     chan []byte `json:"-"`
	LastSeen time.Time `json:"last_seen"`
	hub      *Hub      `json:"-"`
}

// WebSocketConnection interface for WebSocket connections
type WebSocketConnection interface {
	WriteMessage(messageType int, data []byte) error
	ReadMessage() (messageType int, p []byte, err error)
	Close() error
	SetReadLimit(limit int64)
	SetReadDeadline(t time.Time) error
	SetPongHandler(handler func(string) error)
	SetWriteDeadline(t time.Time) error
	NextWriter(messageType int) (io.WriteCloser, error)
}

// Message represents a WebSocket message
type Message struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
	From      string      `json:"from,omitempty"`
	To        string      `json:"to,omitempty"` // "all", "admin", or specific user ID
}

// Notification represents an admin notification
type Notification struct {
	ID        uuid.UUID `json:"id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"` // "info", "success", "warning", "error"
	Target    string    `json:"target"` // "all", "admin", or specific user ID
	CreatedAt time.Time `json:"created_at"`
	Read      bool      `json:"read"`
}

// AdminNotificationRequest represents a request to send notification from admin
type AdminNotificationRequest struct {
	Title   string `json:"title" binding:"required"`
	Message string `json:"message" binding:"required"`
	Type    string `json:"type" binding:"required,oneof=info success warning error"`
	Target  string `json:"target" binding:"required,oneof=all admin"`
}

// ConnectionStats represents WebSocket connection statistics
type ConnectionStats struct {
	TotalConnections int `json:"total_connections"`
	LoggedInUsers    int `json:"logged_in_users"`
	AnonymousUsers   int `json:"anonymous_users"`
	AdminUsers       int `json:"admin_users"`
	Connections      []Client `json:"connections"`
}
