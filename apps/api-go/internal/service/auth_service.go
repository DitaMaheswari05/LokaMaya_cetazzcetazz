package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"

	"lokamaya/api-go/internal/config"
	"lokamaya/api-go/internal/model"
	"lokamaya/api-go/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("email atau password salah")
	ErrTokenBlacklisted   = errors.New("token sudah tidak valid (logout)")
	ErrTokenInvalid       = errors.New("token tidak valid")
	ErrWeakPassword       = errors.New("password minimal 8 karakter, mengandung huruf besar, kecil, dan angka")
	ErrInvalidEmail       = errors.New("format email tidak valid")
	ErrUsernameTooShort   = errors.New("username minimal 3 karakter")
	ErrUsernameInvalid    = errors.New("username hanya boleh mengandung huruf, angka, dan underscore")
)

// AuthService mendefinisikan operasi autentikasi.
type AuthService interface {
	Register(ctx context.Context, req *model.RegisterRequest) (*model.AuthResponse, error)
	Login(ctx context.Context, req *model.LoginRequest) (*model.AuthResponse, error)
	Logout(ctx context.Context, tokenString string) error
	ValidateToken(ctx context.Context, tokenString string) (*model.Claims, error)
}

type authService struct {
	userRepo  repository.UserRepository
	redis     *redis.Client
	cfg       *config.Config
	jwtSecret []byte
}

// NewAuthService membuat instance AuthService baru.
func NewAuthService(userRepo repository.UserRepository, redisClient *redis.Client, cfg *config.Config) AuthService {
	return &authService{
		userRepo:  userRepo,
		redis:     redisClient,
		cfg:       cfg,
		jwtSecret: []byte(cfg.JWTSecret),
	}
}

// ─── Register

// Register memvalidasi input, meng-hash password, menyimpan user baru, lalu mengembalikan JWT.
func (s *authService) Register(ctx context.Context, req *model.RegisterRequest) (*model.AuthResponse, error) {
	// 1. Validasi input
	if err := validateRegisterRequest(req); err != nil {
		return nil, err
	}

	// 2. Hash password dengan bcrypt
	// bcrypt secara otomatis menambahkan salt — tidak perlu salt manual
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), s.cfg.BcryptCost)
	if err != nil {
		return nil, fmt.Errorf("gagal hash password: %w", err)
	}

	// 3. Buat entitas user
	user := &model.User{
		Username:     strings.TrimSpace(req.Username),
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash: string(hash),
		Role:         "user",
	}

	// 4. Simpan ke database
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err // ErrDuplicateEmail / ErrDuplicateUsername sudah di-wrap di repo
	}

	// 5. Generate JWT untuk auto-login setelah register
	token, expiresIn, err := s.generateJWT(user)
	if err != nil {
		return nil, fmt.Errorf("gagal generate token: %w", err)
	}

	return &model.AuthResponse{
		Token:     token,
		TokenType: "Bearer",
		ExpiresIn: expiresIn,
		User: model.UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
		},
	}, nil
}

// ─── Login
func (s *authService) Login(ctx context.Context, req *model.LoginRequest) (*model.AuthResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, ErrInvalidCredentials
	}

	// 1. Cari user berdasarkan email
	user, err := s.userRepo.FindByEmail(ctx, strings.ToLower(strings.TrimSpace(req.Email)))
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			// Jalankan bcrypt dummy untuk mencegah timing attack (user enumeration)
			_ = bcrypt.CompareHashAndPassword([]byte("$2a$12$dummy.hash.to.prevent.timing.attack"), []byte(req.Password))
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("gagal query user: %w", err)
	}

	// 2. Bandingkan password dengan hash (bcrypt.CompareHashAndPassword aman dari timing attack)
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// 3. Generate JWT
	token, expiresIn, err := s.generateJWT(user)
	if err != nil {
		return nil, fmt.Errorf("gagal generate token: %w", err)
	}

	return &model.AuthResponse{
		Token:     token,
		TokenType: "Bearer",
		ExpiresIn: expiresIn,
		User: model.UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
		},
	}, nil
}

// ─── Logout
func (s *authService) Logout(ctx context.Context, tokenString string) error {
	// Parse token untuk mendapatkan expiry time (tanpa validasi blacklist)
	claims, err := s.parseJWT(tokenString)
	if err != nil {
		return ErrTokenInvalid
	}

	// Hitung sisa TTL token
	expiry, err := claims.GetExpirationTime()
	if err != nil || expiry == nil {
		return ErrTokenInvalid
	}
	ttl := time.Until(expiry.Time)
	if ttl <= 0 {
		// Token sudah expired, tidak perlu di-blacklist
		return nil
	}

	// Simpan token ke Redis dengan key "blacklist:<token>" dan TTL = sisa expiry
	// Menggunakan token sebagai key agar unik per token
	redisKey := "auth:blacklist:" + tokenString
	if err := s.redis.Set(ctx, redisKey, "1", ttl).Err(); err != nil {
		return fmt.Errorf("gagal blacklist token: %w", err)
	}

	return nil
}

// ─── Validate Token

// ValidateToken memverifikasi JWT dan mengecek apakah token sudah di-blacklist di Redis.
func (s *authService) ValidateToken(ctx context.Context, tokenString string) (*model.Claims, error) {
	// 1. Cek apakah token sudah di-blacklist (logout)
	redisKey := "auth:blacklist:" + tokenString
	exists, err := s.redis.Exists(ctx, redisKey).Result()
	if err != nil {
		return nil, fmt.Errorf("gagal cek blacklist: %w", err)
	}
	if exists > 0 {
		return nil, ErrTokenBlacklisted
	}

	// 2. Parse dan verify JWT signature + expiry
	claims, err := s.parseJWT(tokenString)
	if err != nil {
		return nil, ErrTokenInvalid
	}

	// 3. Ekstrak custom claims
	userID, _ := claims["user_id"].(string)
	username, _ := claims["username"].(string)
	email, _ := claims["email"].(string)
	role, _ := claims["role"].(string)

	return &model.Claims{
		UserID:   userID,
		Username: username,
		Email:    email,
		Role:     role,
	}, nil
}

func (s *authService) generateJWT(user *model.User) (tokenString string, expiresIn int, err error) {
	expiryDuration := time.Duration(s.cfg.JWTExpiryHours) * time.Hour
	expiresAt := time.Now().Add(expiryDuration)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"email":    user.Email,
		"role":     user.Role,
		"iat":      time.Now().Unix(),
		"exp":      expiresAt.Unix(),
	})

	signed, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", 0, err
	}

	return signed, int(expiryDuration.Seconds()), nil
}

// parseJWT mem-parse token string menjadi MapClaims tanpa cek blacklist.
func (s *authService) parseJWT(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Pastikan algoritma adalah HS256 (cegah "none" algorithm attack)
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("algoritma token tidak didukung: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, ErrTokenInvalid
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrTokenInvalid
	}

	return claims, nil
}

func validateRegisterRequest(req *model.RegisterRequest) error {
	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(req.Email)

	// Validasi username
	if len(req.Username) < 3 {
		return ErrUsernameTooShort
	}
	for _, c := range req.Username {
		if !unicode.IsLetter(c) && !unicode.IsDigit(c) && c != '_' {
			return ErrUsernameInvalid
		}
	}

	// Validasi email (simple check)
	if !strings.Contains(req.Email, "@") || !strings.Contains(req.Email, ".") {
		return ErrInvalidEmail
	}

	// Validasi password strength
	if !isStrongPassword(req.Password) {
		return ErrWeakPassword
	}

	return nil
}

// isStrongPassword mengecek apakah password cukup kuat:
// min 8 karakter, ada huruf besar, huruf kecil, dan angka.
func isStrongPassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	var hasUpper, hasLower, hasDigit bool
	for _, c := range password {
		switch {
		case unicode.IsUpper(c):
			hasUpper = true
		case unicode.IsLower(c):
			hasLower = true
		case unicode.IsDigit(c):
			hasDigit = true
		}
	}
	return hasUpper && hasLower && hasDigit
}
