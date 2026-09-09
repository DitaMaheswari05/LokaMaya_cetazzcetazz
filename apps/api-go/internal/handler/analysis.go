package handler

import (
	"encoding/json"
	"net/http"

	"lokamaya/api-go/internal/model"
	"lokamaya/api-go/internal/service"
)

// AnalysisHandler menangani request analisis spasial dan simulasi skenario halte.
type AnalysisHandler struct {
	analysisService *service.AnalysisService
}

func NewAnalysisHandler(analysisService *service.AnalysisService) *AnalysisHandler {
	return &AnalysisHandler{analysisService: analysisService}
}

// Simulate menjalankan simulasi perubahan halte (tambah, pindah, tutup).
// POST /api/v1/analysis/simulate
func (h *AnalysisHandler) Simulate(w http.ResponseWriter, r *http.Request) {
	var req model.SimulateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Format request tidak valid (harus JSON)",
		})
		return
	}

	if req.Latitude == 0 || req.Longitude == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Koordinat latitude dan longitude wajib diisi",
		})
		return
	}

	if req.ScenarioType == "" {
		req.ScenarioType = "tambah"
	}

	// Cek apakah ada session user (opsional)
	var userID *string
	if user, ok := r.Context().Value("user").(*model.Claims); ok && user != nil {
		userID = &user.UserID
	}

	res, err := h.analysisService.RunSimulation(r.Context(), &req, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, res)
}

// Compare membandingkan dua skenario perubahan halte secara side-by-side.
// POST /api/v1/analysis/compare
func (h *AnalysisHandler) Compare(w http.ResponseWriter, r *http.Request) {
	var req model.CompareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Format request tidak valid (harus JSON)",
		})
		return
	}

	var userID *string
	if user, ok := r.Context().Value("user").(*model.Claims); ok && user != nil {
		userID = &user.UserID
	}

	res, err := h.analysisService.CompareScenarios(r.Context(), &req, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, res)
}

// RunSpatialAnalysis handler lama untuk kompatibilitas.
func (h *AnalysisHandler) RunSpatialAnalysis(w http.ResponseWriter, r *http.Request) {
	h.Simulate(w, r)
}

// GetAccessibilityScore handler cepat untuk skor aksesibilitas saja.
func (h *AnalysisHandler) GetAccessibilityScore(w http.ResponseWriter, r *http.Request) {
	h.Simulate(w, r)
}
