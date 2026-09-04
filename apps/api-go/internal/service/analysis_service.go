package service

// AnalysisService menangani business logic analisis spasial.
// Kalkulasi spatial dilakukan via query PostGIS langsung (ST_Buffer, ST_Intersects, dll).
// TODO: implementasi dengan AnalysisRepository
type AnalysisService struct {
	// repo *repository.AnalysisRepository
}

func NewAnalysisService() *AnalysisService {
	return &AnalysisService{}
}

// TODO: implementasi RunSpatialAnalysis, GetAccessibilityScore, dll
