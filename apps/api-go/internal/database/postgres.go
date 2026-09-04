package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"lokamaya/api-go/internal/config"
)

// NewPostgresPool membuat connection pool pgx ke PostgreSQL + PostGIS.
// TODO: tambahkan konfigurasi pool (MaxConns, MinConns, ConnMaxLifetime) sesuai kebutuhan produksi
func NewPostgresPool(ctx context.Context, cfg *config.Config) (*pgxpool.Pool, error) {
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL tidak boleh kosong")
	}

	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("gagal parse DATABASE_URL: %w", err)
	}

	// TODO: sesuaikan pool settings untuk produksi
	// poolConfig.MaxConns = 20
	// poolConfig.MinConns = 5

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat postgres pool: %w", err)
	}

	// Ping untuk verifikasi koneksi
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("gagal ping postgres: %w", err)
	}

	return pool, nil
}
