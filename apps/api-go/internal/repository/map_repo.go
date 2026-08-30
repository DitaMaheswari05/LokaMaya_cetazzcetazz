package repository

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

// MapRepository menangani query data spasial di PostgreSQL + PostGIS.
// TODO: implementasi dengan sqlc-generated queries
type MapRepository struct {
	db *pgxpool.Pool
}

func NewMapRepository(db *pgxpool.Pool) *MapRepository {
	return &MapRepository{db: db}
}

// TODO: implementasi GetLayers, GetFeaturesByBBox, dll
// Contoh query PostGIS yang akan dipakai:
// SELECT id, name, ST_AsGeoJSON(geometry)::json AS geometry, properties
// FROM spatial_features
// WHERE ST_Intersects(geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326))
