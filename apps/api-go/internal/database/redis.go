package database

import (
	"fmt"

	"github.com/redis/go-redis/v9"
	"lokamaya/api-go/internal/config"
)

// NewRedisClient membuat Redis client dari REDIS_URL.
// Format URL: redis://[:password@]host[:port][/db-number]
func NewRedisClient(cfg *config.Config) (*redis.Client, error) {
	if cfg.RedisURL == "" {
		return nil, fmt.Errorf("REDIS_URL tidak boleh kosong")
	}

	opts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("gagal parse REDIS_URL: %w", err)
	}

	client := redis.NewClient(opts)

	// TODO: tambahkan ping check saat startup
	// ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	// defer cancel()
	// if err := client.Ping(ctx).Err(); err != nil {
	// 	return nil, fmt.Errorf("gagal ping redis: %w", err)
	// }

	return client, nil
}
