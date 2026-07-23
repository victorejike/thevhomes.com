// Package cache provides an optional Redis-backed response cache. When
// REDIS_URL is not configured, every method becomes a safe no-op so the API
// works fine without Redis in local/dev environments.
package cache

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache struct {
	client *redis.Client
}

// New parses rawURL (e.g. "redis://user:pass@host:6379/0") and returns a
// Cache. If rawURL is empty, the returned Cache silently no-ops.
func New(rawURL string) *Cache {
	if rawURL == "" {
		return &Cache{}
	}

	opts, err := redis.ParseURL(rawURL)
	if err != nil {
		log.Printf("cache: invalid REDIS_URL, caching disabled: %v", err)
		return &Cache{}
	}

	client := redis.NewClient(opts)
	if err := client.Ping(context.Background()).Err(); err != nil {
		log.Printf("cache: could not reach redis, caching disabled: %v", err)
		return &Cache{}
	}

	log.Println("cache: connected to redis")
	return &Cache{client: client}
}

func (c *Cache) Enabled() bool { return c.client != nil }

// Get returns the cached value for key, or ("", false) on miss/disabled.
func (c *Cache) Get(ctx context.Context, key string) (string, bool) {
	if c.client == nil {
		return "", false
	}
	val, err := c.client.Get(ctx, key).Result()
	if err != nil {
		return "", false
	}
	return val, true
}

// Set stores value under key with the given TTL. No-op when disabled.
func (c *Cache) Set(ctx context.Context, key, value string, ttl time.Duration) {
	if c.client == nil {
		return
	}
	c.client.Set(ctx, key, value, ttl)
}

// InvalidatePrefix removes all keys starting with prefix. Used after writes
// (property create/update/delete) to keep the listing cache consistent.
func (c *Cache) InvalidatePrefix(ctx context.Context, prefix string) {
	if c.client == nil {
		return
	}
	iter := c.client.Scan(ctx, 0, prefix+"*", 0).Iterator()
	for iter.Next(ctx) {
		c.client.Del(ctx, iter.Val())
	}
}
