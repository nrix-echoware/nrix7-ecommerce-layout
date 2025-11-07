package hub

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

func GetCurrentTime() time.Time {
	return time.Now()
}

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	maxMessageSize = 512
)

var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WSClient struct {
	ID        string
	UserID    string
	Email     string
	SessionID string
	IsAdmin   bool
	Conn      *websocket.Conn
	Send      chan []byte
	LastSeen  time.Time
	Hub       *WSHub
}

type WSMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
	From      string      `json:"from,omitempty"`
}

type WSHub struct {
	clients      map[*WSClient]bool
	broadcast    chan []byte
	Register     chan *WSClient
	Unregister   chan *WSClient
	adminClients map[*WSClient]bool
	mu           sync.RWMutex
}

func NewWSHub() *WSHub {
	return &WSHub{
		clients:      make(map[*WSClient]bool),
		broadcast:    make(chan []byte),
		Register:     make(chan *WSClient),
		Unregister:   make(chan *WSClient),
		adminClients: make(map[*WSClient]bool),
	}
}

func (h *WSHub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.clients[client] = true
			if client.IsAdmin {
				h.adminClients[client] = true
			}
			h.mu.Unlock()
			log.Printf("WS Client connected: %s (Admin: %v)", client.ID, client.IsAdmin)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				if client.IsAdmin {
					delete(h.adminClients, client)
				}
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("WS Client disconnected: %s", client.ID)

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
					if client.IsAdmin {
						delete(h.adminClients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *WSHub) SendToAdmin(msg WSMessage) {
	messageBytes, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling WS message: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.adminClients {
		select {
		case client.Send <- messageBytes:
		default:
			close(client.Send)
			delete(h.clients, client)
			delete(h.adminClients, client)
		}
	}
}

func (h *WSHub) SendToUser(userID string, msg WSMessage) {
	messageBytes, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling WS message: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if client.UserID == userID || client.Email == userID {
			select {
			case client.Send <- messageBytes:
			default:
				close(client.Send)
				delete(h.clients, client)
				if client.IsAdmin {
					delete(h.adminClients, client)
				}
			}
		}
	}
}

func (h *WSHub) Broadcast(msg WSMessage) {
	messageBytes, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling WS message: %v", err)
		return
	}

	h.broadcast <- messageBytes
}

type ConnectionStats struct {
	TotalConnections int `json:"total_connections"`
	LoggedInUsers    int `json:"logged_in_users"`
	AnonymousUsers   int `json:"anonymous_users"`
	AdminUsers       int `json:"admin_users"`
	Connections      []WSClientInfo `json:"connections"`
}

type WSClientInfo struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id,omitempty"`
	Email     string    `json:"email,omitempty"`
	SessionID string    `json:"session_id,omitempty"`
	IsAdmin   bool      `json:"is_admin"`
	LastSeen  time.Time `json:"last_seen"`
}

func (h *WSHub) GetConnectionStats() *ConnectionStats {
	h.mu.RLock()
	defer h.mu.RUnlock()

	stats := &ConnectionStats{
		TotalConnections: len(h.clients),
		Connections:      make([]WSClientInfo, 0, len(h.clients)),
	}

	for client := range h.clients {
		info := WSClientInfo{
			ID:        client.ID,
			UserID:    client.UserID,
			Email:     client.Email,
			SessionID: client.SessionID,
			IsAdmin:   client.IsAdmin,
			LastSeen:  client.LastSeen,
		}
		stats.Connections = append(stats.Connections, info)

		if client.IsAdmin {
			stats.AdminUsers++
		} else if client.Email != "" || client.UserID != "" {
			stats.LoggedInUsers++
		} else {
			stats.AnonymousUsers++
		}
	}

	return stats
}

func (c *WSClient) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

func (c *WSClient) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

