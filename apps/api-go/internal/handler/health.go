package handler

import (
	"encoding/json"
	"net/http"
)

// HealthHandler menangani request GET /health dan GET /readyz.
type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Health mengembalikan status service.
// Mirip dengan endpoint /health di FastAPI sebelumnya.
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "lokamaya-api",
	})
}

// Ready dipakai Docker/Kubernetes untuk readiness probe.
// TODO: tambahkan cek koneksi DB dan Redis di sini
func (h *HealthHandler) Ready(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, map[string]string{
		"status": "ready",
	})
}

// respond adalah helper untuk encode JSON response.
func respond(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
	}
}

// respondError adalah helper untuk encode JSON error response.
func respondError(w http.ResponseWriter, status int, message string) {
	respond(w, status, map[string]string{"error": message})
}
