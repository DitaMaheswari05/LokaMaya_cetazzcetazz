package service

import (
	"context"
	"fmt"
	"strings"

	"lokamaya/api-go/internal/client"
	"lokamaya/api-go/internal/model"
	"lokamaya/api-go/internal/repository"
)

// RAGService menangani pencarian semantik dokumen regulasi tata ruang dan pedoman transit.
// Flow: Query teks → embedding via ai-service BGE-M3 → pgvector similarity search → LiteLLM AI synthesis.
type RAGService struct {
	regulationRepo *repository.RegulationRepository
	aiClient       *client.AIClient
	litellm        *client.LiteLLMClient
}

func NewRAGService(
	regulationRepo *repository.RegulationRepository,
	aiClient *client.AIClient,
	litellm *client.LiteLLMClient,
) *RAGService {
	return &RAGService{
		regulationRepo: regulationRepo,
		aiClient:       aiClient,
		litellm:        litellm,
	}
}

// Search mencari klausul regulasi relevan menggunakan cosine similarity pgvector atau keyword fallback.
func (s *RAGService) Search(ctx context.Context, req *model.RAGSearchRequest) (*model.RAGSearchResult, error) {
	if req.TopK <= 0 {
		req.TopK = 5
	}

	var docs []model.RegulationDocument
	var err error

	// 1. Coba embedding semantik via Gemini di LiteLLM
	if s.litellm != nil {
		embeddings, embErr := s.litellm.Embed(ctx, "text-embedding-004", []string{req.Query})
		if embErr == nil && len(embeddings) > 0 {
			docs, err = s.regulationRepo.SimilaritySearch(ctx, embeddings[0], req.TopK, req.Region)
		} else {
			// Fallback ke keyword search jika embedding gagal
			docs, err = s.regulationRepo.SearchByKeyword(ctx, req.Query, req.TopK)
		}
	} else {
		docs, err = s.regulationRepo.SearchByKeyword(ctx, req.Query, req.TopK)
	}

	if err != nil {
		return nil, fmt.Errorf("pencarian regulasi gagal: %w", err)
	}

	res := &model.RAGSearchResult{
		Documents: docs,
	}

	// 2. Jika diminta dan LiteLLM aktif, sintesis narasi kepatuhan hukum via AI
	if req.GenerateAI && s.litellm != nil && len(docs) > 0 {
		var contextBuilder strings.Builder
		for i, doc := range docs {
			contextBuilder.WriteString(fmt.Sprintf("[%d] %s (%s, Bagian: %s)\n%s\n\n", i+1, doc.Title, doc.Source, doc.Section, doc.Content))
		}

		sysPrompt := `Anda adalah Ahli Regulasi Tata Ruang DKI Jakarta dan Transportasi Perkotaan (LokaMaya Legal Assistant).
Tugas Anda: Berikan analisa kepatuhan hukum yang ringkas, tegas, dan berdasar klausul regulasi resmi yang disediakan.
Format jawaban:
1. Kesimpulan Kelayakan Hukum (Layak/Bersyarat/Tidak Layak)
2. Klausul Regulasi Terkait & Analisis
3. Rekomendasi Mitigasi Teknis`

		userPrompt := fmt.Sprintf("Pertanyaan / Kasus Spasial:\n%s\n\nDokumen Regulasi Terkait:\n%s\nBerikan analisis kepatuhan hukum ringkas.", req.Query, contextBuilder.String())

		msgs := []client.ChatMessage{
			{Role: "system", Content: sysPrompt},
			{Role: "user", Content: userPrompt},
		}

		aiText, aiErr := s.litellm.Complete(ctx, "", msgs)
		if aiErr == nil {
			res.AIResponse = aiText
		}
	}

	return res, nil
}

// GetByID mengambil dokumen regulasi berdasarkan ID.
func (s *RAGService) GetByID(ctx context.Context, id int64) (*model.RegulationDocument, error) {
	return s.regulationRepo.GetByID(ctx, id)
}

