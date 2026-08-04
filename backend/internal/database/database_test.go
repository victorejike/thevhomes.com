package database

import "testing"

func TestNormalizeDatabaseURLAddsSSLMode(t *testing.T) {
	dsn := normalizeDatabaseURL("postgresql://user:pass@host:5432/db")
	if dsn != "postgresql://user:pass@host:5432/db?sslmode=require" {
		t.Fatalf("expected sslmode=require to be appended, got %q", dsn)
	}
}

func TestNormalizeDatabaseURLPreservesExistingSSLMode(t *testing.T) {
	dsn := normalizeDatabaseURL("postgresql://user:pass@host:5432/db?sslmode=disable")
	if dsn != "postgresql://user:pass@host:5432/db?sslmode=disable" {
		t.Fatalf("expected existing sslmode to be preserved, got %q", dsn)
	}
}
