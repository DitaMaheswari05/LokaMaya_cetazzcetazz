package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config menyimpan semua konfigurasi yang dibaca dari environment variable.
type Config struct {
	Port          string
	DatabaseURL   string
	RedisURL      string
	OSRMURL       string
	AIServiceURL  string // URL ke Python ai-service (:8001)
	LiteLLMURL    string // URL ke LiteLLM proxy (:4000)
	LiteLLMAPIKey string
	MapIDAPIKey   string

	// Auth & Security
	JWTSecret      string // Secret key untuk sign JWT — WAJIB diisi di .env
	JWTExpiryHours int    // Masa berlaku token dalam jam (default: 24)
	BcryptCost     int    // Cost factor bcrypt (default: 12, range 4-31)
}

// Load membaca environment variable dan mengembalikan Config.
// File .env akan dimuat otomatis jika ada (untuk development lokal).
func Load() *Config {
	// Cari .env dari beberapa lokasi — mendukung run dari mana saja dalam monorepo
	// Urutan: ./  →  ../  →  ../../  (project root)
	loadDotEnv()

	jwtExpiry := getEnvInt("JWT_EXPIRY_HOURS", 24)
	bcryptCost := getEnvInt("BCRYPT_COST", 12)

	// Validasi JWT_SECRET — wajib ada dan tidak boleh pakai nilai default contoh
	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" || jwtSecret == "ganti-dengan-random-string-minimal-32-karakter-rahasia" {
		log.Fatal("FATAL: JWT_SECRET belum dikonfigurasi di .env. Generate dengan: openssl rand -hex 32")
	}

	return &Config{
		Port:           getEnv("GO_API_PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		RedisURL:       getEnv("REDIS_URL", ""),
		OSRMURL:        getEnv("OSRM_URL", "http://osrm:5000"),
		AIServiceURL:   getEnv("AI_SERVICE_URL", "http://ai-service:8001"),
		LiteLLMURL:     getEnv("LITELLM_URL", "http://litellm:4000"),
		LiteLLMAPIKey:  getEnv("LITELLM_API_KEY", ""),
		MapIDAPIKey:    getEnv("NEXT_PUBLIC_MAPID_API_KEY", ""),
		JWTSecret:      jwtSecret,
		JWTExpiryHours: jwtExpiry,
		BcryptCost:     bcryptCost,
	}
}

// getEnv mengambil nilai env var, dengan fallback ke defaultValue jika kosong.
func getEnv(key, defaultValue string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultValue
}

// getEnvInt mengambil nilai env var sebagai integer, dengan fallback ke defaultValue.
func getEnvInt(key string, defaultValue int) int {
	if val := os.Getenv(key); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return defaultValue
}

// loadDotEnv mencoba memuat .env dari beberapa lokasi.
// Ini diperlukan di monorepo karena posisi .env (project root) berbeda
// dengan working directory saat go run dijalankan (apps/api-go/).
// Urutan pencarian: ./  →  ../  →  ../../  →  ../../../
//
// PENTING: menggunakan Overload() bukan Load() agar nilai di .env
// SELALU override env var sistem (berguna saat dev punya DATABASE_URL
// atau env var lain yang di-set global untuk project lain).
func loadDotEnv() {
	candidates := []string{
		".env",
		"../.env",
		"../../.env",
		"../../../.env",
	}
	for _, path := range candidates {
		if err := godotenv.Overload(path); err == nil {
			log.Printf("info: .env dimuat dari %s (mengoverride env var sistem)", path)
			return
		}
	}
	log.Println("info: file .env tidak ditemukan, menggunakan environment variable yang sudah ada")
}
