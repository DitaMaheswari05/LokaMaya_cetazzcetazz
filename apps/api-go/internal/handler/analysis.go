package handler

import (
	"net/http"
)

// AnalysisHandler menangani request analisis spasial.
// TODO: implementasi lengkap dengan AnalysisService
type AnalysisHandler struct {
	// service *service.AnalysisService
}

func NewAnalysisHandler() *AnalysisHandler {
	return &AnalysisHandler{}
}

// RunSpatialAnalysis menjalankan analisis spasial (buffer, intersect, dll).
// POST /api/v1/analysis/spatial
func (h *AnalysisHandler) RunSpatialAnalysis(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	// 1. Decode SpatialAnalysisRequest dari request body
	// 2. Panggil AnalysisService.RunAnalysis()
	// 3. Return SpatialAnalysisResult sebagai GeoJSON
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}

// GetAccessibilityScore menghitung skor aksesibilitas suatu lokasi.
// POST /api/v1/analysis/accessibility
func (h *AnalysisHandler) GetAccessibilityScore(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}
