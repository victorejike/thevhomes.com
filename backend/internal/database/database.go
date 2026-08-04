package database

import (
	"log"
	"net/url"
	"strings"

	"github.com/thevhomes/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect opens a PostgreSQL connection via GORM and runs auto-migrations
// for every domain model. Called once at startup from cmd/server/main.go.
func Connect(dsn string) (*gorm.DB, error) {
	normalizedDSN := normalizeDatabaseURL(dsn)
	db, err := gorm.Open(postgres.Open(normalizedDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, err
	}

	if err := migrate(db); err != nil {
		return nil, err
	}

	log.Println("database connected and migrated")
	return db, nil
}

func normalizeDatabaseURL(dsn string) string {
	if strings.TrimSpace(dsn) == "" {
		return dsn
	}

	parsed, err := url.Parse(dsn)
	if err != nil || parsed.Scheme == "" {
		return dsn
	}

	query := parsed.Query()
	if _, ok := query["sslmode"]; !ok {
		query.Set("sslmode", "require")
		parsed.RawQuery = query.Encode()
	}

	return parsed.String()
}

func migrate(db *gorm.DB) error {
	// AutoMigrate is additive/backward-compatible: existing columns/tables are
	// preserved, and only missing tables/columns/indexes are created. Order
	// matters for foreign keys — dependents are migrated after what they
	// reference.
	return db.AutoMigrate(
		&models.User{},
		&models.Agent{},
		&models.Property{},
		&models.PropertyImage{},
		&models.Booking{},
		&models.Conversation{},
		&models.Message{},
		&models.Review{},
		&models.Payment{},
		&models.Investment{},

		// Phase 2: auth + identity verification
		&models.GoogleAccount{},
		&models.RefreshTokenRecord{},
		&models.IdentityVerification{},
		&models.VerifyMeResponse{},
		&models.AuditLog{},

		// Phase 2: agent onboarding + approval
		&models.AgentApplication{},
		&models.AgentNumberSequence{},

		// Phase 2: property verification + 3D tours + maps
		&models.PropertyReview{},
		&models.PropertyVerificationLog{},
		&models.PropertyTour{},
		&models.PropertyTourScene{},
		&models.PropertyNearbyPlace{},

		// Phase 2: viewing payments, tickets, live sessions
		&models.ViewingTicket{},
		&models.LiveViewingSession{},

		// Phase 2: notifications
		&models.Notification{},
	)
}
