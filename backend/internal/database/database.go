package database

import (
	"log"

	"github.com/thevhomes/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect opens a PostgreSQL connection via GORM and runs auto-migrations
// for every domain model. Called once at startup from cmd/server/main.go.
func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
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

func migrate(db *gorm.DB) error {
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
	)
}
