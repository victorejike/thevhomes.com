package models

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"strings"
)

// StringArray adapts a Go []string to a Postgres text[] column for GORM.
type StringArray []string

// Value implements driver.Valuer for writing to Postgres.
func (a StringArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "{}", nil
	}
	escaped := make([]string, len(a))
	for i, s := range a {
		escaped[i] = `"` + strings.ReplaceAll(s, `"`, `\"`) + `"`
	}
	return "{" + strings.Join(escaped, ",") + "}", nil
}

// Scan implements sql.Scanner for reading from Postgres.
func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = StringArray{}
		return nil
	}

	var raw string
	switch v := value.(type) {
	case string:
		raw = v
	case []byte:
		raw = string(v)
	default:
		return errors.New(fmt.Sprintf("unsupported type for StringArray: %T", value))
	}

	raw = strings.TrimPrefix(raw, "{")
	raw = strings.TrimSuffix(raw, "}")
	if raw == "" {
		*a = StringArray{}
		return nil
	}

	parts := strings.Split(raw, ",")
	result := make(StringArray, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		p = strings.TrimPrefix(p, `"`)
		p = strings.TrimSuffix(p, `"`)
		p = strings.ReplaceAll(p, `\"`, `"`)
		result = append(result, p)
	}
	*a = result
	return nil
}
