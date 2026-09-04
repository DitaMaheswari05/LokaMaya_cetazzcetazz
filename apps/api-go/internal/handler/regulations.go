package handler

import (
	"net/http"
)

// RegulationsHandler menangani request pencarian dokumen regulasi tata ruang (RAG).
// TODO: implementasi lengkap dengan RAGService
type RegulationsHandler struct {
	// service *service.RAGService
}

func NewRegulationsHandler() *RegulationsHandler {
	return &RegulationsHandler{}
}

// SearchRegulations melakukan pencarian semantik dokumen regulasi.
// POST /api/v1/regulations/search
func (h *RegulationsHandler) SearchRegulations(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	// 1. Decode RAGSearchRequest dari request body
	// 2. Panggil RAGService.Search() → kirim teks ke ai-service untuk embedding
	// 3. Query pgvector similarity search di PostgreSQL
	// 4. (Opsional) Panggil LiteLLM untuk generate narasi
	// 5. Return RAGSearchResult
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}

// GetRegulation mengembalikan satu dokumen regulasi berdasarkan ID.
// GET /api/v1/regulations/{id}
func (h *RegulationsHandler) GetRegulation(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}
