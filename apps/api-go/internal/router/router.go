package router

import (
	"net/http"

	"lokamaya/api-go/internal/handler"
	"lokamaya/api-go/internal/mcp"
	"lokamaya/api-go/internal/middleware"
	"lokamaya/api-go/internal/service"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

// New membuat dan mengembalikan chi Router dengan semua route terdaftar.
func New(
	healthH *handler.HealthHandler,
	mapH *handler.MapHandler,
	analysisH *handler.AnalysisHandler,
	routingH *handler.RoutingHandler,
	regulationsH *handler.RegulationsHandler,
	communityH *handler.CommunityHandler,
	authH *handler.AuthHandler,
	chatH *handler.ChatHandler,
	mcpServer *mcp.Server,
	authSvc service.AuthService,
) http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.Recoverer)  // recover dari panic
	r.Use(middleware.RequestLogger) // log setiap request
	r.Use(middleware.CORS)          // CORS headers

	r.Get("/health", healthH.Health)
	r.Get("/readyz", healthH.Ready)

	// MCP (Model Context Protocol) Server endpoints (Anthropic SSE transport)
	r.Route("/mcp", func(r chi.Router) {
		r.Get("/sse", mcpServer.HandleSSE)
		r.Post("/messages", mcpServer.HandleMessages)
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.OptionalAuth(authSvc))

		// Auth — public routes (tidak butuh JWT) - TETAP DIPERTAHANKAN
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authH.Register)
			r.Post("/login", authH.Login)
			// Logout butuh JWT yang valid
			r.With(middleware.RequireAuth(authSvc)).Post("/logout", authH.Logout)
		})

		// Map — layer dan fitur spasial
		r.Route("/map", func(r chi.Router) {
			r.Get("/layers", mapH.GetLayers)
			r.Get("/features", mapH.GetFeatures)
		})

		// Analysis — analisis spasial, simulasi halte, dan AI Urban Council
		r.Route("/analysis", func(r chi.Router) {
			r.Post("/simulate", analysisH.Simulate)
			r.Post("/compare", analysisH.Compare)
			r.Post("/spatial", analysisH.RunSpatialAnalysis)
			r.Post("/accessibility", analysisH.GetAccessibilityScore)
			r.Post("/deliberate", analysisH.Deliberate)
			r.Post("/optimal", analysisH.FindOptimal)
			r.Post("/policy-brief", analysisH.PolicyBrief)
			r.Post("/od-trip", analysisH.AnalyzeODTrip)
		})

		// Chat — AI Chatbot Assistant dengan Agentic Tool Calling & Real-Time Streaming (SSE)
		r.Route("/chat", func(r chi.Router) {
			r.Post("/", chatH.Chat)
			r.Post("/stream", chatH.ChatStream)
		})

		// Routing — isochrone dan route via OSRM
		r.Route("/routing", func(r chi.Router) {
			r.Get("/isochrone", routingH.GetIsochrone)
			r.Get("/route", routingH.GetRoute)
		})

		// Regulations — pencarian semantik dokumen regulasi (RAG)
		r.Route("/regulations", func(r chi.Router) {
			r.Post("/search", regulationsH.SearchRegulations)
			r.Get("/{id}", regulationsH.GetRegulation)
		})

		// Community — Community Maps dan klasifikasi IndoBERT
		r.Route("/community", func(r chi.Router) {
			r.Get("/maps", communityH.GetCommunityMaps)
			r.Post("/classify", communityH.ClassifyCommunityMap)
		})
	})

	return r
}
