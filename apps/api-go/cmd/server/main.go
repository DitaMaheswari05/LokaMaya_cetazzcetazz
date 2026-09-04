package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"lokamaya/api-go/internal/client"
	"lokamaya/api-go/internal/config"
	"lokamaya/api-go/internal/database"
	"lokamaya/api-go/internal/handler"
	"lokamaya/api-go/internal/repository"
	"lokamaya/api-go/internal/router"
	"lokamaya/api-go/internal/service"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// config.Load() akan fatal jika JWT_SECRET tidak dikonfigurasi dengan benar
	cfg := config.Load()
	log.Info().Str("port", cfg.Port).Msg("memulai LokaMaya Go API")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := database.NewPostgresPool(ctx, cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("gagal connect ke PostgreSQL")
	}
	defer db.Close()
	log.Info().Msg("PostgreSQL terhubung")

	// ─── Database — Redis
	redisClient, err := database.NewRedisClient(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("gagal connect ke Redis")
	}
	defer redisClient.Close()
	log.Info().Msg("Redis terhubung")

	// ─── Clients (HTTP clients ke service eksternal)
	_ = client.NewOSRMClient(cfg.OSRMURL)
	_ = client.NewAIClient(cfg.AIServiceURL)
	_ = client.NewLiteLLMClient(cfg.LiteLLMURL, cfg.LiteLLMAPIKey)
	// TODO: inject clients ke service saat implementasi

	// ─── Repositories
	userRepo := repository.NewUserRepository(db)

	// ─── Services
	authSvc := service.NewAuthService(userRepo, redisClient, cfg)

	// ─── Handlers
	healthH := handler.NewHealthHandler()
	mapH := handler.NewMapHandler()
	analysisH := handler.NewAnalysisHandler()
	routingH := handler.NewRoutingHandler()
	regulationsH := handler.NewRegulationsHandler()
	communityH := handler.NewCommunityHandler()
	authH := handler.NewAuthHandler(authSvc)

	r := router.New(healthH, mapH, analysisH, routingH, regulationsH, communityH, authH, authSvc)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Jalankan server di goroutine terpisah agar tidak blocking
	go func() {
		log.Info().Str("addr", srv.Addr).Msg("server berjalan")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server error")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("menerima sinyal shutdown, menghentikan server...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("server shutdown error")
	}
	log.Info().Msg("server berhenti")
}
