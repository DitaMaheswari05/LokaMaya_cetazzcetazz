package middleware

import (
	"net/http"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// RequestLogger mencatat setiap incoming request dengan method, path, status, dan durasi.
// Menggunakan zerolog untuk output structured JSON log.
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap ResponseWriter untuk menangkap status code
		ww := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(ww, r)

		// Log request setelah selesai
		level := zerolog.InfoLevel
		if ww.status >= 500 {
			level = zerolog.ErrorLevel
		} else if ww.status >= 400 {
			level = zerolog.WarnLevel
		}

		log.WithLevel(level).
			Str("method", r.Method).
			Str("path", r.URL.Path).
			Int("status", ww.status).
			Dur("duration", time.Since(start)).
			Str("remote_addr", r.RemoteAddr).
			Msg("request")
	})
}

// responseWriter wrapper untuk menangkap status code.
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
