package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all environment-driven configuration for the API server.
type Config struct {
	Env                  string
	Port                 string
	DatabaseURL          string
	RedisURL             string
	JWTAccessSecret      string
	JWTRefreshSecret     string
	AccessTokenTTLMin    int
	RefreshTokenTTLDay   int
	FrontendURL          string
	CloudflareR2Bucket   string
	CloudflareR2Key      string
	CloudflareR2Secret   string
	CloudflareR2Endpoint string
	PaystackSecretKey    string
	FlutterwaveSecretKey string
	SMTPHost             string
	SMTPPort             string
	SMTPUser             string
	SMTPPassword         string
	GoogleMapsAPIKey     string
	OpenAIAPIKey         string
}

// Load reads a .env file (if present) and environment variables into a Config struct.
// Missing optional values fall back to sensible defaults so the server can boot
// in "scaffold mode" without every third-party credential configured.
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, relying on system environment variables")
	}

	return &Config{
		Env:                  getEnv("APP_ENV", "development"),
		Port:                 getEnv("PORT", "8080"),
		DatabaseURL:          getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/thevhomes?sslmode=disable"),
		RedisURL:             getEnv("REDIS_URL", ""),
		JWTAccessSecret:      getEnv("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
		JWTRefreshSecret:     getEnv("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
		AccessTokenTTLMin:    15,
		RefreshTokenTTLDay:   30,
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:3000"),
		CloudflareR2Bucket:   getEnv("CLOUDFLARE_R2_BUCKET", ""),
		CloudflareR2Key:      getEnv("CLOUDFLARE_R2_ACCESS_KEY", ""),
		CloudflareR2Secret:   getEnv("CLOUDFLARE_R2_SECRET_KEY", ""),
		CloudflareR2Endpoint: getEnv("CLOUDFLARE_R2_ENDPOINT", ""),
		PaystackSecretKey:    getEnv("PAYSTACK_SECRET_KEY", ""),
		FlutterwaveSecretKey: getEnv("FLUTTERWAVE_SECRET_KEY", ""),
		SMTPHost:             getEnv("SMTP_HOST", ""),
		SMTPPort:             getEnv("SMTP_PORT", "587"),
		SMTPUser:             getEnv("SMTP_USER", ""),
		SMTPPassword:         getEnv("SMTP_PASSWORD", ""),
		GoogleMapsAPIKey:     getEnv("GOOGLE_MAPS_API_KEY", ""),
		OpenAIAPIKey:         getEnv("OPENAI_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
