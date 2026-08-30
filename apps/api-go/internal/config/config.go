package config

import (
	"log"
	"os"

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
}

// Load membaca environment variable dan mengembalikan Config.
// File .env akan dimuat otomatis jika ada (untuk development lokal).
func Load() *Config {
	// Muat .env jika ada; abaikan error (production pakai env langsung)
	if err := godotenv.Load(); err != nil {
		log.Println("info: file .env tidak ditemukan, menggunakan environment variable yang sudah ada")
	}

	return &Config{
		Port:          getEnv("GO_API_PORT", "8080"),
		DatabaseURL:   getEnv("DATABASE_URL", ""),
		RedisURL:      getEnv("REDIS_URL", ""),
		OSRMURL:       getEnv("OSRM_URL", "http://osrm:5000"),
		AIServiceURL:  getEnv("AI_SERVICE_URL", "http://ai-service:8001"),
		LiteLLMURL:    getEnv("LITELLM_URL", "http://litellm:4000"),
		LiteLLMAPIKey: getEnv("LITELLM_API_KEY", ""),
		MapIDAPIKey:   getEnv("NEXT_PUBLIC_MAPID_API_KEY", ""),
	}
}

// getEnv mengambil nilai env var, dengan fallback ke defaultValue jika kosong.
func getEnv(key, defaultValue string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultValue
}
