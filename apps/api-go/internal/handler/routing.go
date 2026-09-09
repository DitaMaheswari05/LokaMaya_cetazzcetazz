package handler

import (
	"net/http"
	"strconv"

	"lokamaya/api-go/internal/repository"
)

// RoutingHandler menangani request routing dan isochrone pejalan kaki.
type RoutingHandler struct {
	spatialRepo *repository.SpatialRepository
}

func NewRoutingHandler(spatialRepo *repository.SpatialRepository) *RoutingHandler {
	return &RoutingHandler{spatialRepo: spatialRepo}
}

// GetIsochrone mengembalikan isochrone GeoJSON dari suatu titik berdasarkan jangkauan jalan kaki 5-10 menit.
// GET /api/v1/routing/isochrone?lat=...&lng=...
func (h *RoutingHandler) GetIsochrone(w http.ResponseWriter, r *http.Request) {
	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")

	lat, err1 := strconv.ParseFloat(latStr, 64)
	lng, err2 := strconv.ParseFloat(lngStr, 64)
	if err1 != nil || err2 != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Query parameter 'lat' dan 'lng' wajib berupa angka koordinat valid",
		})
		return
	}

	isochrone := h.spatialRepo.GenerateIsochrone(lat, lng)
	writeJSON(w, http.StatusOK, isochrone)
}

// GetRoute mengembalikan rute terbaik antara dua titik.
// GET /api/v1/routing/route?origin=...&destination=...
func (h *RoutingHandler) GetRoute(w http.ResponseWriter, r *http.Request) {
	// TODO: implementasi
	respondError(w, http.StatusNotImplemented, "belum diimplementasi")
}
