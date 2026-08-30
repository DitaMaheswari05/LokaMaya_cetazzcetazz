package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"lokamaya/api-go/internal/handler"
	"lokamaya/api-go/internal/middleware"
)

// New membuat dan mengembalikan chi Router dengan semua route terdaftar.
// Mirip dengan registrasi router di FastAPI (app.include_router).
func New(
	healthH *handler.HealthHandler,
	mapH *handler.MapHandler,
	analysisH *handler.AnalysisHandler,
	routingH *handler.RoutingHandler,
	regulationsH *handler.RegulationsHandler,
	communityH *handler.CommunityHandler,
) http.Handler {
	r := chi.NewRouter()

	// ─── Global Middleware ───────────────────────────────────────────────────
	r.Use(chimiddleware.Recoverer)   // recover dari panic
	r.Use(middleware.RequestLogger)  // log setiap request
	r.Use(middleware.CORS)           // CORS headers

	// ─── Health & Readiness ──────────────────────────────────────────────────
	r.Get("/health", healthH.Health)
	r.Get("/readyz", healthH.Ready)

	// ─── API v1 ──────────────────────────────────────────────────────────────
	r.Route("/api/v1", func(r chi.Router) {

		// Map — layer dan fitur spasial
		r.Route("/map", func(r chi.Router) {
			r.Get("/layers", mapH.GetLayers)
			r.Get("/features", mapH.GetFeatures)
		})

		// Analysis — analisis spasial dan aksesibilitas
		r.Route("/analysis", func(r chi.Router) {
			r.Post("/spatial", analysisH.RunSpatialAnalysis)
			r.Post("/accessibility", analysisH.GetAccessibilityScore)
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
