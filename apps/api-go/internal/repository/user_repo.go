package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"lokamaya/api-go/internal/model"
)

// ErrUserNotFound dikembalikan ketika user tidak ditemukan di database.
var ErrUserNotFound = errors.New("user tidak ditemukan")

// ErrDuplicateEmail dikembalikan ketika email sudah terdaftar.
var ErrDuplicateEmail = errors.New("email sudah terdaftar")

// ErrDuplicateUsername dikembalikan ketika username sudah dipakai.
var ErrDuplicateUsername = errors.New("username sudah dipakai")

// UserRepository mendefinisikan operasi database untuk entitas User.
type UserRepository interface {
	Create(ctx context.Context, user *model.User) error
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	FindByUsername(ctx context.Context, username string) (*model.User, error)
	FindByID(ctx context.Context, id string) (*model.User, error)
}

// pgUserRepository adalah implementasi UserRepository menggunakan pgxpool.
type pgUserRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository membuat instance baru pgUserRepository.
func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &pgUserRepository{db: db}
}

// Create menyimpan user baru ke database.
// Menggunakan parameterized query untuk mencegah SQL injection.
func (r *pgUserRepository) Create(ctx context.Context, user *model.User) error {
	query := `
		INSERT INTO users (username, email, password_hash, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query,
		user.Username,
		user.Email,
		user.PasswordHash,
		user.Role,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		// Deteksi unique constraint violation dari PostgreSQL
		if isUniqueViolation(err, "users_email_key") || isUniqueViolation(err, "users_username_email_key") {
			return ErrDuplicateEmail
		}
		if isUniqueViolation(err, "users_username_key") {
			return ErrDuplicateUsername
		}
		return fmt.Errorf("gagal membuat user: %w", err)
	}
	return nil
}

// FindByEmail mencari user berdasarkan email.
// Digunakan untuk proses login.
func (r *pgUserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `
		SELECT id, username, email, password_hash, role, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("gagal query user by email: %w", err)
	}
	return user, nil
}

// FindByUsername mencari user berdasarkan username.
func (r *pgUserRepository) FindByUsername(ctx context.Context, username string) (*model.User, error) {
	query := `
		SELECT id, username, email, password_hash, role, created_at, updated_at
		FROM users
		WHERE username = $1
	`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("gagal query user by username: %w", err)
	}
	return user, nil
}

// FindByID mencari user berdasarkan UUID.
// Digunakan oleh middleware auth untuk validasi token.
func (r *pgUserRepository) FindByID(ctx context.Context, id string) (*model.User, error) {
	query := `
		SELECT id, username, email, password_hash, role, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("gagal query user by id: %w", err)
	}
	return user, nil
}

// isUniqueViolation mengecek apakah error adalah PostgreSQL unique constraint violation (kode 23505).
func isUniqueViolation(err error, constraintName string) bool {
	if err == nil {
		return false
	}
	// pgx menyimpan kode error PostgreSQL di dalam PgError
	errStr := err.Error()
	return contains(errStr, "23505") || contains(errStr, constraintName)
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsStr(s, substr))
}

func containsStr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
