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

// Deliberate menjalankan simulasi musyawarah multi-agent AI Urban Council.
// POST /api/v1/analysis/deliberate
func (h *AnalysisHandler) Deliberate(w http.ResponseWriter, r *http.Request) {
	var req model.SimulateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Format request tidak valid",
		})
		return
	}

	sim, err := h.analysisService.RunSimulation(r.Context(), &req, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	delib, err := h.analysisService.DeliberateStakeholders(r.Context(), sim)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, delib)
}

// FindOptimal mencari titik halte Pareto-optimal di koridor jalan.
// POST /api/v1/analysis/optimal
func (h *AnalysisHandler) FindOptimal(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CorridorName string  `json:"corridor_name"`
		CenterLat    float64 `json:"center_latitude"`
		CenterLng    float64 `json:"center_longitude"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
		return
	}

	res, err := h.analysisService.FindOptimalStops(r.Context(), req.CorridorName, req.CenterLat, req.CenterLng, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, res)
}

// PolicyBrief membuat draf naskah kebijakan formal.
// POST /api/v1/analysis/policy-brief
func (h *AnalysisHandler) PolicyBrief(w http.ResponseWriter, r *http.Request) {
	var req model.SimulateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
		return
	}

	sim, err := h.analysisService.RunSimulation(r.Context(), &req, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	brief, err := h.analysisService.GeneratePolicyBrief(r.Context(), sim)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"simulation_id": sim.ID,
		"stop_name":     sim.StopName,
		"policy_brief":  brief,
	})
}

// AnalyzeODTrip menganalisis perjalanan titik A ke B, bottleneck, rekomendasi halte, dan simulasi komuter.
// POST /api/v1/analysis/od-trip
func (h *AnalysisHandler) AnalyzeODTrip(w http.ResponseWriter, r *http.Request) {
	var req model.ODTripRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Format request tidak valid (harus JSON)"})
		return
	}

	if req.Origin.Latitude == 0 || req.Origin.Longitude == 0 || req.Destination.Latitude == 0 || req.Destination.Longitude == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Koordinat origin (Titik A) dan destination (Titik B) wajib diisi"})
		return
	}

	var userID *string
	if user, ok := r.Context().Value("user").(*model.Claims); ok && user != nil {
		userID = &user.UserID
	}

	res, err := h.analysisService.AnalyzeODTrip(r.Context(), req.Origin, req.Destination, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, res)
}


