package middleware

import (
	"context"
	"net/http"
	"strings"

	"lokamaya/api-go/internal/model"
	"lokamaya/api-go/internal/service"
)

// contextKey adalah tipe private untuk kunci context (mencegah collision).
type contextKey string

const ClaimsKey contextKey = "auth_claims"

// GetClaims mengambil model.Claims dari context jika ada.
func GetClaims(ctx context.Context) *model.Claims {
	if ctx == nil {
		return nil
	}
	if claims, ok := ctx.Value(ClaimsKey).(*model.Claims); ok {
		return claims
	}
	return nil
}

// extractToken mengekstrak token dari Authorization header atau cookie "token".
func extractToken(r *http.Request) string {
	var tokenString string
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			tokenString = parts[1]
		}
	}

	if tokenString == "" {
		if cookie, err := r.Cookie("token"); err == nil {
			tokenString = cookie.Value
		}
	}
	return tokenString
}

func RequireAuth(authSvc service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString := extractToken(r)

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

// OptionalAuth mengekstrak JWT jika ada, tapi tidak memblokir request jika tidak ada atau expired.
func OptionalAuth(authSvc service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString := extractToken(r)
			if tokenString != "" {
				claims, err := authSvc.ValidateToken(r.Context(), tokenString)
				if err == nil && claims != nil {
					ctx := context.WithValue(r.Context(), ClaimsKey, claims)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

// writeUnauthorized mengirim response 401 dengan pesan error dalam JSON.
func writeUnauthorized(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = w.Write([]byte(`{"error":"` + message + `"}`))
}
