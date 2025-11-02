package chat

import (
	"encoding/json"
	"sync"
)

type SSEMessage struct {
	Resource     string                 `json:"resource"`
	ResourceType string                 `json:"resource_type"`
	Data         map[string]interface{} `json:"data"`
}

type SSEHub struct {
	adminClients map[chan []byte]bool
	userClients  map[string]map[chan []byte]bool
	mu           sync.RWMutex
}

func NewSSEHub() *SSEHub {
	return &SSEHub{
		adminClients: make(map[chan []byte]bool),
		userClients:  make(map[string]map[chan []byte]bool),
	}
}

func (h *SSEHub) RegisterAdmin(client chan []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.adminClients[client] = true
}

func (h *SSEHub) UnregisterAdmin(client chan []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.adminClients, client)
	close(client)
}

func (h *SSEHub) RegisterUser(userID string, client chan []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.userClients[userID] == nil {
		h.userClients[userID] = make(map[chan []byte]bool)
	}
	h.userClients[userID][client] = true
}

func (h *SSEHub) UnregisterUser(userID string, client chan []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.userClients[userID] != nil {
		delete(h.userClients[userID], client)
		close(client)
		if len(h.userClients[userID]) == 0 {
			delete(h.userClients, userID)
		}
	}
}

func (h *SSEHub) BroadcastToAdmin(msg SSEMessage) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.adminClients {
		select {
		case client <- data:
		default:
			delete(h.adminClients, client)
			close(client)
		}
	}
}

func (h *SSEHub) BroadcastToUser(userID string, msg SSEMessage) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	if clients, ok := h.userClients[userID]; ok {
		for client := range clients {
			select {
			case client <- data:
			default:
				delete(h.userClients[userID], client)
				close(client)
			}
		}
	}
}

