package handler

import (
	"net/http"
)

// MapHandler menangani semua request terkait layer dan fitur peta.
// TODO: implementasi lengkap dengan MapService
type MapHandler struct {
	// service *service.MapService
}

func NewMapHandler() *MapHandler {
	return &MapHandler{}
}

// GetLayers mengembalikan daftar layer yang tersedia.
// GET /api/v1/map/layers
func (h *MapHandler) GetLayers(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}

// GetFeatures mengembalikan fitur spasial berdasarkan bounding box atau filter.
// GET /api/v1/map/features
func (h *MapHandler) GetFeatures(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}
