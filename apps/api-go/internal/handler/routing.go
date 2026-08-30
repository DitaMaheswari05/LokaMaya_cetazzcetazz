package handler

import (
	"net/http"
)

// RoutingHandler menangani request routing dan isochrone via OSRM.
// TODO: implementasi lengkap dengan RoutingService
type RoutingHandler struct {
	// service *service.RoutingService
}

func NewRoutingHandler() *RoutingHandler {
	return &RoutingHandler{}
}

// GetIsochrone mengembalikan isochrone GeoJSON dari suatu titik berdasarkan waktu tempuh.
// GET /api/v1/routing/isochrone?lat=...&lng=...&duration=...
func (h *RoutingHandler) GetIsochrone(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	// 1. Parse query params: lat, lng, duration (menit), profile (walking/driving)
	// 2. Panggil RoutingService.GetIsochrone() → proxy ke OSRM
	// 3. Return GeoJSON FeatureCollection
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}

// GetRoute mengembalikan rute terbaik antara dua titik.
// GET /api/v1/routing/route?origin=...&destination=...
func (h *RoutingHandler) GetRoute(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}
