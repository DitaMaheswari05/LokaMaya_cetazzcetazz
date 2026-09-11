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
	"lokamaya/api-go/internal/mcp"
	"lokamaya/api-go/internal/repository"
	"lokamaya/api-go/internal/router"
	"lokamaya/api-go/internal/service"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// config.Load() membaca .env dan environment variables
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
	osrmCli := client.NewOSRMClient(cfg.OSRMURL)
	aiCli := client.NewAIClient(cfg.AIServiceURL)
	litellmCli := client.NewLiteLLMClient(cfg.LiteLLMURL, cfg.LiteLLMAPIKey, cfg.GeminiAPIKey)

	// ─── Repositories
	userRepo := repository.NewUserRepository(db)
	spatialRepo := repository.NewSpatialRepository(db, osrmCli)
	regulationRepo := repository.NewRegulationRepository(db)

	// ─── Services
	authSvc := service.NewAuthService(userRepo, redisClient, cfg)
	analysisSvc := service.NewAnalysisService(spatialRepo, litellmCli, osrmCli)
	chatSvc := service.NewChatService(litellmCli, analysisSvc)
	ragSvc := service.NewRAGService(regulationRepo, aiCli, litellmCli)

	// ─── Handlers
	healthH := handler.NewHealthHandler()
	mapH := handler.NewMapHandler(spatialRepo)
	analysisH := handler.NewAnalysisHandler(analysisSvc)
	routingH := handler.NewRoutingHandler(spatialRepo)
	regulationsH := handler.NewRegulationsHandler(ragSvc)
	communityH := handler.NewCommunityHandler()
	authH := handler.NewAuthHandler(authSvc)
	chatH := handler.NewChatHandler(chatSvc)

	// ─── MCP Server
	mcpServer := mcp.NewServer(analysisSvc, chatSvc, spatialRepo)

	r := router.New(healthH, mapH, analysisH, routingH, regulationsH, communityH, authH, chatH, mcpServer, authSvc)

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
