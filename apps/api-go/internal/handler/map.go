package handler

import (
	"net/http"
)

// MapHandler menangani semua request terkait layer dan metadata peta.
type MapHandler struct{}

func NewMapHandler() *MapHandler {
	return &MapHandler{}
}

// LayerConfig mendefinisikan metadata satu layer peta untuk UI.
type LayerConfig struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Group       string `json:"group"` // "transit", "zonasi", "demografi", "lingkungan", "survei"
	Description string `json:"description"`
	Visible     bool   `json:"visible"`
	Opacity     float64 `json:"opacity"`
}

// GetLayers mengembalikan daftar layer yang dapat di-toggle di panel WebGIS sesuai PRD.
// GET /api/v1/map/layers
func (h *MapHandler) GetLayers(w http.ResponseWriter, r *http.Request) {
	layers := []LayerConfig{
		{
			ID:          "transjakarta_stops",
			Name:        "Halte Eksisting",
			Group:       "transit",
			Description: "Titik halte TransJakarta aktif di seluruh DKI Jakarta",
			Visible:     true,
			Opacity:     1.0,
		},
		{
			ID:          "transjakarta_routes",
			Name:        "Rute Koridor BRT",
			Group:       "transit",
			Description: "Jalur koridor utama dan rute TransJakarta",
			Visible:     true,
			Opacity:     0.8,
		},
		{
			ID:          "isochrone_walk",
			Name:        "Isochrone Jangkauan Jalan Kaki",
			Group:       "transit",
			Description: "Area terjangkau 5-10 menit jalan kaki (OSRM)",
			Visible:     true,
			Opacity:     0.4,
		},
		{
			ID:          "rdtr_landuse",
			Name:        "Zonasi RDTR 2022",
			Group:       "zonasi",
			Description: "Kesesuaian tata ruang DKI Jakarta (Jakarta Satu)",
			Visible:     false,
			Opacity:     0.5,
		},
		{
			ID:          "flood_hazard",
			Name:        "Peta Rawan Banjir",
			Group:       "lingkungan",
			Description: "Zona risiko genangan banjir InaRISK / BPBD DKI",
			Visible:     false,
			Opacity:     0.5,
		},
		{
			ID:          "survey_activities",
			Name:        "Catatan Survei Lapangan",
			Group:       "survei",
			Description: "20+ titik hasil observasi lapangan Tim LokaMaya",
			Visible:     true,
			Opacity:     1.0,
		},
		{
			ID:          "umkm_density",
			Name:        "Sebaran Ekonomi UMKM",
			Group:       "demografi",
			Description: "Agregasi Struk Go & Menu Go",
			Visible:     false,
			Opacity:     0.6,
		},
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"layers": layers,
	})
}

// GetFeatures mengembalikan fitur spasial untuk layer tertentu.
// GET /api/v1/map/features
func (h *MapHandler) GetFeatures(w http.ResponseWriter, r *http.Request) {
	layer := r.URL.Query().Get("layer")

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"type":     "FeatureCollection",
		"layer":    layer,
		"features": []interface{}{},
	})
}
