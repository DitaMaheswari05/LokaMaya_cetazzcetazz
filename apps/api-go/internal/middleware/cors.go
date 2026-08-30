package middleware

import (
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
)

// CORS menambahkan header CORS untuk semua request.
// TODO: sesuaikan AllowedOrigins dengan domain frontend (Vercel/Netlify) di produksi
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Logger adalah alias ke chi's built-in request logger.
// Gunakan ini di router agar semua request ter-log otomatis.
var Logger = middleware.Logger
