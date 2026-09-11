package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"lokamaya/api-go/internal/model"
	"lokamaya/api-go/internal/service"

	"github.com/go-chi/chi/v5"
)

// RegulationsHandler menangani request pencarian dokumen regulasi tata ruang (RAG).
type RegulationsHandler struct {
	ragService *service.RAGService
}

func NewRegulationsHandler(ragService *service.RAGService) *RegulationsHandler {
	return &RegulationsHandler{
		ragService: ragService,
	}
}

// SearchRegulations melakukan pencarian semantik dokumen regulasi.
// POST /api/v1/regulations/search
func (h *RegulationsHandler) SearchRegulations(w http.ResponseWriter, r *http.Request) {
	var req model.RAGSearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Format request tidak valid: " + err.Error(),
		})
		return
	}

	if req.Query == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Query tidak boleh kosong",
		})
		return
	}

	result, err := h.ragService.Search(r.Context(), &req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// GetRegulation mengembalikan satu dokumen regulasi berdasarkan ID.
// GET /api/v1/regulations/{id}
func (h *RegulationsHandler) GetRegulation(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "ID harus berupa angka numerik",
		})
		return
	}

	doc, err := h.ragService.GetByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Dokumen regulasi tidak ditemukan",
		})
		return
	}

	writeJSON(w, http.StatusOK, doc)
}

