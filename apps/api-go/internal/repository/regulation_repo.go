package repository

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"lokamaya/api-go/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RegulationRepository menangani query dokumen regulasi dan pencarian vektor via pgvector.
type RegulationRepository struct {
	db *pgxpool.Pool
}

func NewRegulationRepository(db *pgxpool.Pool) *RegulationRepository {
	return &RegulationRepository{db: db}
}

// formatVector mengonversi slice float32 menjadi format literal pgvector `[0.1,0.2,...]`.
func formatVector(vec []float32) string {
	var sb strings.Builder
	sb.WriteString("[")
	for i, val := range vec {
		if i > 0 {
			sb.WriteString(",")
		}
		sb.WriteString(strconv.FormatFloat(float64(val), 'f', -1, 32))
	}
	sb.WriteString("]")
	return sb.String()
}

// SimilaritySearch mencari dokumen regulasi terdekat berdasarkan cosine similarity pgvector.
func (r *RegulationRepository) SimilaritySearch(
	ctx context.Context,
	embedding []float32,
	limit int,
	region string,
) ([]model.RegulationDocument, error) {
	if limit <= 0 {
		limit = 5
	}

	vecStr := formatVector(embedding)

	query := `
		SELECT id, title, category, COALESCE(section, ''), content, source, COALESCE(region, ''), created_at::text,
		       1 - (embedding <=> $1::vector) AS similarity
		FROM regulations
		WHERE ($2 = '' OR region ILIKE '%' || $2 || '%')
		ORDER BY embedding <=> $1::vector
		LIMIT $3
	`

	rows, err := r.db.Query(ctx, query, vecStr, region, limit)
	if err != nil {
		return nil, fmt.Errorf("pgvector similarity search failed: %w", err)
	}
	defer rows.Close()

	var docs []model.RegulationDocument
	for rows.Next() {
		var doc model.RegulationDocument
		if err := rows.Scan(
			&doc.ID,
			&doc.Title,
			&doc.Category,
			&doc.Section,
			&doc.Content,
			&doc.Source,
			&doc.Region,
			&doc.CreatedAt,
			&doc.Similarity,
		); err != nil {
			return nil, fmt.Errorf("scan regulation row: %w", err)
		}
		docs = append(docs, doc)
	}

	return docs, nil
}

// GetByID mengambil dokumen regulasi berdasarkan ID.
func (r *RegulationRepository) GetByID(ctx context.Context, id int64) (*model.RegulationDocument, error) {
	query := `
		SELECT id, title, category, COALESCE(section, ''), content, source, COALESCE(region, ''), created_at::text
		FROM regulations
		WHERE id = $1
	`
	var doc model.RegulationDocument
	err := r.db.QueryRow(ctx, query, id).Scan(
		&doc.ID,
		&doc.Title,
		&doc.Category,
		&doc.Section,
		&doc.Content,
		&doc.Source,
		&doc.Region,
		&doc.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("regulation not found: %w", err)
	}
	return &doc, nil
}

// SearchByKeyword fallback text search jika embedding microservice tidak aktif.
func (r *RegulationRepository) SearchByKeyword(ctx context.Context, queryStr string, limit int) ([]model.RegulationDocument, error) {
	if limit <= 0 {
		limit = 5
	}
	query := `
		SELECT id, title, category, COALESCE(section, ''), content, source, COALESCE(region, ''), created_at::text, 0.5 AS similarity
		FROM regulations
		WHERE title ILIKE '%' || $1 || '%' OR content ILIKE '%' || $1 || '%'
		LIMIT $2
	`
	rows, err := r.db.Query(ctx, query, queryStr, limit)
	if err != nil {
		return nil, fmt.Errorf("keyword search failed: %w", err)
	}
	defer rows.Close()

	var docs []model.RegulationDocument
	for rows.Next() {
		var doc model.RegulationDocument
		if err := rows.Scan(
			&doc.ID,
			&doc.Title,
			&doc.Category,
			&doc.Section,
			&doc.Content,
			&doc.Source,
			&doc.Region,
			&doc.CreatedAt,
			&doc.Similarity,
		); err != nil {
			return nil, fmt.Errorf("scan row: %w", err)
		}
		docs = append(docs, doc)
	}
	return docs, nil
}

