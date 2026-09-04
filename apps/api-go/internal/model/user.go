package model

import "time"

// User merepresentasikan entitas user di database.
// password_hash TIDAK pernah di-expose ke luar (tidak ada json tag).
type User struct {
	ID           string    `db:"id"`
	Username     string    `db:"username"`
	Email        string    `db:"email"`
	PasswordHash string    `db:"password_hash"` // bcrypt hash, TIDAK boleh di-serialize ke JSON
	Role         string    `db:"role"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

// ─── Request/Response DTOs ────────────────────────────────────────────────────

// RegisterRequest adalah body request untuk endpoint POST /auth/register.
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest adalah body request untuk endpoint POST /auth/login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse adalah response sukses untuk login/register.
// Berisi JWT token yang digunakan untuk request-request selanjutnya.
type AuthResponse struct {
	Token     string   `json:"token"`
	TokenType string   `json:"token_type"` // selalu "Bearer"
	ExpiresIn int      `json:"expires_in"` // dalam detik
	User      UserInfo `json:"user"`
}

// UserInfo adalah data user yang aman untuk di-expose ke client (tanpa password).
type UserInfo struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

// Claims adalah JWT payload yang kita embed ke dalam token.
type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}
