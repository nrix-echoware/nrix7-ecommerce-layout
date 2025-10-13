package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from the clients
	broadcast chan []byte

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe operations
	mutex sync.RWMutex

	// Admin clients (for admin panel)
	adminClients map[*Client]bool
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		clients:      make(map[*Client]bool),
		broadcast:    make(chan []byte),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		adminClients: make(map[*Client]bool),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			if client.IsAdmin {
				h.adminClients[client] = true
			}
			h.mutex.Unlock()

			log.Printf("Client connected: %s (Admin: %v)", client.ID, client.IsAdmin)

			// Send connection stats to admin clients
			h.sendConnectionStats()

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				if client.IsAdmin {
					delete(h.adminClients, client)
				}
				close(client.Send)
			}
			h.mutex.Unlock()

			log.Printf("Client disconnected: %s", client.ID)

			// Send connection stats to admin clients
			h.sendConnectionStats()

		case message := <-h.broadcast:
			h.mutex.RLock()
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
			h.mutex.RUnlock()
		}
	}
}

// SendNotification sends a notification to specific clients
func (h *Hub) SendNotification(notification *Notification) {
	message := Message{
		Type:      "notification",
		Data:      notification,
		Timestamp: time.Now(),
		From:      "admin",
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling notification: %v", err)
		return
	}

	h.mutex.RLock()
	defer h.mutex.RUnlock()

	// Send to all clients if target is "all"
	if notification.Target == "all" {
		for client := range h.clients {
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
	} else if notification.Target == "admin" {
		// Send only to admin clients
		for client := range h.adminClients {
			select {
			case client.Send <- messageBytes:
			default:
				close(client.Send)
				delete(h.clients, client)
				delete(h.adminClients, client)
			}
		}
	} else {
		// Send to specific user
		for client := range h.clients {
			if client.ID == notification.Target || client.Email == notification.Target {
				select {
				case client.Send <- messageBytes:
				default:
					close(client.Send)
					delete(h.clients, client)
					if client.IsAdmin {
						delete(h.adminClients, client)
					}
				}
				break
			}
		}
	}
}

// GetConnectionStats returns current connection statistics
func (h *Hub) GetConnectionStats() *ConnectionStats {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	stats := &ConnectionStats{
		TotalConnections: len(h.clients),
		Connections:      make([]Client, 0, len(h.clients)),
	}

	for client := range h.clients {
		// Create a copy without the connection and channel
		clientCopy := Client{
			ID:        client.ID,
			Email:     client.Email,
			SessionID: client.SessionID,
			IsAdmin:   client.IsAdmin,
			LastSeen:  client.LastSeen,
		}
		stats.Connections = append(stats.Connections, clientCopy)

		if client.IsAdmin {
			stats.AdminUsers++
		} else if client.Email != "" {
			stats.LoggedInUsers++
		} else {
			stats.AnonymousUsers++
		}
	}

	return stats
}

// sendConnectionStats sends connection statistics to admin clients
func (h *Hub) sendConnectionStats() {
	stats := h.GetConnectionStats()
	message := Message{
		Type:      "connection_stats",
		Data:      stats,
		Timestamp: time.Now(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling connection stats: %v", err)
		return
	}

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

// BroadcastMessage broadcasts a message to all clients
func (h *Hub) BroadcastMessage(messageType string, data interface{}) {
	message := Message{
		Type:      messageType,
		Data:      data,
		Timestamp: time.Now(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	h.broadcast <- messageBytes
}
