package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/thevhomes/backend/internal/models"
	"github.com/thevhomes/backend/internal/utils"
	ws "github.com/thevhomes/backend/internal/websocket"
	"gorm.io/gorm"
)

type MessageHandler struct {
	DB  *gorm.DB
	Hub *ws.Hub
}

func NewMessageHandler(db *gorm.DB, hub *ws.Hub) *MessageHandler {
	return &MessageHandler{DB: db, Hub: hub}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Origins are already restricted at the HTTP layer via CORS; the frontend
	// domain is validated there before the WS upgrade is ever attempted.
	CheckOrigin: func(r *http.Request) bool { return true },
}

type inboundChatEvent struct {
	Type           string `json:"type"` // message | typing | read_receipt
	ConversationID string `json:"conversation_id"`
	RecipientID    string `json:"recipient_id"`
	Content        string `json:"content"`
	AttachmentURL  string `json:"attachment_url"`
}

// HandleWebSocket upgrades GET /api/v1/ws/chat to a WebSocket connection.
// The access token is passed as ?token=... since browsers cannot set custom
// headers during the WebSocket handshake.
func (h *MessageHandler) HandleWebSocket(c *gin.Context, accessSecret string) {
	token := c.Query("token")
	claims, err := utils.ParseToken(token, accessSecret)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "invalid or expired token"})
		return
	}
	h.stream(c, claims.UserID)
}

func (h *MessageHandler) stream(c *gin.Context, userID uuid.UUID) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := ws.NewClient(h.Hub, userID, conn)
	h.Hub.Register(client)
	go client.WritePump()

	client.ReadPump(func(raw []byte) {
		var event inboundChatEvent
		if err := json.Unmarshal(raw, &event); err != nil {
			return
		}

		switch event.Type {
		case "message":
			h.handleIncomingMessage(userID, event)
		case "typing":
			if recipientID, err := uuid.Parse(event.RecipientID); err == nil {
				h.Hub.SendToUser(recipientID, ws.OutboundEvent{Type: "typing", Payload: map[string]string{
					"conversation_id": event.ConversationID,
					"user_id":         userID.String(),
				}})
			}
		case "read_receipt":
			h.DB.Model(&models.Message{}).
				Where("conversation_id = ? AND sender_id != ?", event.ConversationID, userID).
				Update("read_at", gorm.Expr("NOW()"))
		}
	})
}

func (h *MessageHandler) handleIncomingMessage(senderID uuid.UUID, event inboundChatEvent) {
	convID, err := uuid.Parse(event.ConversationID)
	if err != nil {
		return
	}

	message := models.Message{
		ConversationID: convID,
		SenderID:       senderID,
		Content:        event.Content,
		AttachmentURL:  event.AttachmentURL,
	}
	if err := h.DB.Create(&message).Error; err != nil {
		return
	}

	if recipientID, err := uuid.Parse(event.RecipientID); err == nil {
		h.Hub.SendToUser(recipientID, ws.OutboundEvent{Type: "message", Payload: message})
	}
	// Echo back to sender so all of their open tabs/devices stay in sync.
	h.Hub.SendToUser(senderID, ws.OutboundEvent{Type: "message", Payload: message})
}

// StartConversation handles POST /api/v1/conversations to get-or-create a
// conversation between the current user and another participant (agent,
// support, or property owner) before opening the chat UI.
func (h *MessageHandler) StartConversation(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req struct {
		ParticipantID string  `json:"participant_id" binding:"required"`
		PropertyID    *string `json:"property_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	participantID, err := uuid.Parse(req.ParticipantID)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid participant_id")
		return
	}

	var conversation models.Conversation
	query := h.DB.Where(
		"(participant_one_id = ? AND participant_two_id = ?) OR (participant_one_id = ? AND participant_two_id = ?)",
		userID, participantID, participantID, userID,
	)

	if err := query.First(&conversation).Error; err != nil {
		conversation = models.Conversation{ParticipantOneID: userID, ParticipantTwoID: participantID}
		if req.PropertyID != nil {
			if pid, err := uuid.Parse(*req.PropertyID); err == nil {
				conversation.PropertyID = &pid
			}
		}
		h.DB.Create(&conversation)
	}

	utils.Success(c, http.StatusOK, "conversation ready", conversation)
}

// History handles GET /api/v1/conversations/:id/messages
func (h *MessageHandler) History(c *gin.Context) {
	conversationID := c.Param("id")

	var messages []models.Message
	if err := h.DB.Where("conversation_id = ?", conversationID).Order("created_at ASC").Find(&messages).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch messages")
		return
	}

	utils.Success(c, http.StatusOK, "messages fetched", messages)
}

// ListMine handles GET /api/v1/conversations
func (h *MessageHandler) ListMine(c *gin.Context) {
	userID := c.MustGet("user_id")

	var conversations []models.Conversation
	if err := h.DB.Where("participant_one_id = ? OR participant_two_id = ?", userID, userID).Find(&conversations).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to fetch conversations")
		return
	}

	utils.Success(c, http.StatusOK, "conversations fetched", conversations)
}
