package handlers

import (
	"github.com/google/uuid"
	"github.com/thevhomes/backend/internal/models"
	"gorm.io/gorm"
)

// writeAuditLog persists an immutable record of a sensitive administrative
// action (approvals, rejections, verification decisions), satisfying the
// "audit all approval and verification actions" security requirement.
func writeAuditLog(db *gorm.DB, actorID *uuid.UUID, action, entityType, entityID, metadata, ip string) {
	db.Create(&models.AuditLog{
		ActorID:    actorID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Metadata:   metadata,
		IPAddress:  ip,
	})
}
