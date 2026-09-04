package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"lokamaya/api-go/internal/model"
	"lokamaya/api-go/internal/repository"
	"lokamaya/api-go/internal/service"
)

// AuthHandler menangani semua HTTP request terkait autentikasi.
type AuthHandler struct {
	authService service.AuthService
}

// NewAuthHandler membuat instance AuthHandler baru.
func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Request body tidak valid (harus JSON)",
		})
		return
	}

	resp, err := h.authService.Register(r.Context(), &req)
	if err != nil {
		status := http.StatusInternalServerError
		switch {
		case errors.Is(err, repository.ErrDuplicateEmail):
			status = http.StatusConflict
		case errors.Is(err, repository.ErrDuplicateUsername):
			status = http.StatusConflict
		case errors.Is(err, service.ErrWeakPassword),
			errors.Is(err, service.ErrInvalidEmail),
			errors.Is(err, service.ErrUsernameTooShort),
			errors.Is(err, service.ErrUsernameInvalid):
			status = http.StatusUnprocessableEntity
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}

	// Set HttpOnly Cookie
	if resp != nil && resp.Token != "" {
		setTokenCookie(w, resp.Token)
	}

	writeJSON(w, http.StatusCreated, resp)
}

// ─── Login ───────────────────────────────────────────────────────────────────

// Login menangani POST /api/v1/auth/login
//
// Request body:
//
//	{ "email": "...", "password": "..." }
//
// Response 200 OK:
//
//	{ "token": "...", "token_type": "Bearer", "expires_in": 86400, "user": {...} }
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Request body tidak valid (harus JSON)",
		})
		return
	}

	resp, err := h.authService.Login(r.Context(), &req)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrInvalidCredentials) {
			// Selalu return 401, bukan 404 — jangan bocorkan apakah email terdaftar
			status = http.StatusUnauthorized
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}

	// Set HttpOnly Cookie
	if resp != nil && resp.Token != "" {
		setTokenCookie(w, resp.Token)
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Ambil token dari Authorization header (sudah divalidasi oleh middleware)
	authHeader := r.Header.Get("Authorization")
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == "" {
		// Jika tidak ada header, coba ambil dari cookie
		if cookie, err := r.Cookie("token"); err == nil {
			tokenString = cookie.Value
		}
	}

	if err := h.authService.Logout(r.Context(), tokenString); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Gagal logout",
		})
		return
	}

	// Hapus cookie token dari browser
	clearTokenCookie(w)

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Berhasil logout",
	})
}

// writeJSON menulis response JSON dengan status code yang ditentukan.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// setTokenCookie mengatur JWT ke dalam HttpOnly Cookie.
func setTokenCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		MaxAge:   86400,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})
}

// clearTokenCookie menghapus cookie token.
func clearTokenCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})
}
