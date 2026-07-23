// Package websocket implements the real-time chat layer used by the
// customer <-> agent / support messaging system.
package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// OutboundEvent is the envelope sent to connected clients.
type OutboundEvent struct {
	Type    string      `json:"type"` // message | typing | read_receipt | presence
	Payload interface{} `json:"payload"`
}

// Client wraps a single authenticated WebSocket connection.
type Client struct {
	UserID uuid.UUID
	Conn   *websocket.Conn
	Send   chan OutboundEvent
	hub    *Hub
}

// Hub keeps track of connected clients and fans out events between them.
// It is intentionally in-memory and single-instance; for multi-instance
// deployment on Render, back this with Redis pub/sub (see internal/config
// RedisURL) so events fan out across replicas.
type Hub struct {
	mu      sync.RWMutex
	clients map[uuid.UUID]*Client
}

func NewHub() *Hub {
	return &Hub{clients: make(map[uuid.UUID]*Client)}
}

func (h *Hub) Register(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[client.UserID] = client
	h.broadcastPresence(client.UserID, "online")
}

func (h *Hub) Unregister(userID uuid.UUID) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if client, ok := h.clients[userID]; ok {
		close(client.Send)
		delete(h.clients, userID)
	}
	h.broadcastPresence(userID, "offline")
}

// SendToUser delivers an event to a specific connected user, if online.
func (h *Hub) SendToUser(userID uuid.UUID, event OutboundEvent) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	client, ok := h.clients[userID]
	if !ok {
		return false
	}
	select {
	case client.Send <- event:
		return true
	default:
		return false
	}
}

func (h *Hub) broadcastPresence(userID uuid.UUID, status string) {
	for id, client := range h.clients {
		if id == userID {
			continue
		}
		select {
		case client.Send <- OutboundEvent{Type: "presence", Payload: map[string]string{
			"user_id": userID.String(),
			"status":  status,
		}}:
		default:
		}
	}
}

// WritePump flushes queued events to the socket.
func (c *Client) WritePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case event, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			data, err := json.Marshal(event)
			if err != nil {
				continue
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, data); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ReadPump processes inbound events (chat messages, typing indicators) and
// invokes onMessage so the HTTP handler layer can persist them to Postgres.
func (c *Client) ReadPump(onMessage func(raw []byte)) {
	defer func() {
		c.hub.Unregister(c.UserID)
	}()

	c.Conn.SetReadLimit(1 << 20) // 1MB, generous enough for base64 image thumbnails
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Println("websocket read error:", err)
			}
			return
		}
		onMessage(message)
	}
}

func NewClient(hub *Hub, userID uuid.UUID, conn *websocket.Conn) *Client {
	return &Client{UserID: userID, Conn: conn, Send: make(chan OutboundEvent, 16), hub: hub}
}
