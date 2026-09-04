package repository

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

// CommunityRepository menangani query data Community Maps di PostgreSQL.
// TODO: implementasi dengan sqlc-generated queries
type CommunityRepository struct {
	db *pgxpool.Pool
}

func NewCommunityRepository(db *pgxpool.Pool) *CommunityRepository {
	return &CommunityRepository{db: db}
}

// TODO: implementasi GetByBBox, GetByCategory, Insert, UpdateCategory, dll
