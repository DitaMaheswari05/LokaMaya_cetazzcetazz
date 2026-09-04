package middleware

import (
	"context"
	"net/http"
	"strings"

	"lokamaya/api-go/internal/service"
)

// contextKey adalah tipe private untuk kunci context (mencegah collision).
type contextKey string

const ClaimsKey contextKey = "auth_claims"

func RequireAuth(authSvc service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 1. Coba baca dari Authorization header
			var tokenString string
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
					tokenString = parts[1]
				}
			}

			// 2. Jika tidak ada di header, coba baca dari cookie "token" (untuk frontend browser aman dari XSS)
			if tokenString == "" {
				if cookie, err := r.Cookie("token"); err == nil {
					tokenString = cookie.Value
				}
			}

			// Jika token tetap kosong setelah dicek keduanya
			if tokenString == "" {
				writeUnauthorized(w, "Token autentikasi tidak ditemukan di header atau cookie")
				return
			}

			// 3. Validasi token (cek signature, expiry, dan Redis blacklist)
			claims, err := authSvc.ValidateToken(r.Context(), tokenString)
			if err != nil {
				writeUnauthorized(w, "Token tidak valid atau sudah expired")
				return
			}

			// 4. Inject claims ke context agar bisa diakses oleh handler
			ctx := context.WithValue(r.Context(), ClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// writeUnauthorized mengirim response 401 dengan pesan error dalam JSON.
func writeUnauthorized(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = w.Write([]byte(`{"error":"` + message + `"}`))
}
