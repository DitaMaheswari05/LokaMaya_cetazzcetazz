package repository

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegulationRepository menangani query dokumen regulasi dan pencarian vektor via pgvector.
// TODO: implementasi dengan sqlc-generated queries
type RegulationRepository struct {
	db *pgxpool.Pool
}

func NewRegulationRepository(db *pgxpool.Pool) *RegulationRepository {
	return &RegulationRepository{db: db}
}

// TODO: implementasi SimilaritySearch, GetByID, Insert, dll
// Contoh query pgvector yang akan dipakai:
// SELECT id, title, content, source, region,
//        1 - (embedding <=> $1::vector) AS similarity
// FROM regulations
// ORDER BY embedding <=> $1::vector
// LIMIT $2
