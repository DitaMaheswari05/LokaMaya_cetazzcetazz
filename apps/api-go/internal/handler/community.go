package handler

import (
	"net/http"
)

// CommunityHandler menangani request Community Maps dan klasifikasi IndoBERT.
// TODO: implementasi lengkap dengan CommunityService
type CommunityHandler struct {
	// service *service.CommunityService
}

func NewCommunityHandler() *CommunityHandler {
	return &CommunityHandler{}
}

// GetCommunityMaps mengembalikan daftar Community Maps dengan filter spasial.
// GET /api/v1/community/maps?bbox=...&category=...
func (h *CommunityHandler) GetCommunityMaps(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}

// ClassifyCommunityMap melakukan klasifikasi teks Community Maps menggunakan IndoBERT.
// POST /api/v1/community/classify
func (h *CommunityHandler) ClassifyCommunityMap(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	// 1. Decode ClassifyRequest dari request body
	// 2. Panggil CommunityService.Classify() → proxy ke ai-service
	// 3. Return ClassifyResponse
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}
