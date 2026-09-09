package service

import (
	"context"
	"crypto/rand"
	"fmt"
	"time"

	"lokamaya/api-go/internal/client"
	"lokamaya/api-go/internal/model"
	"lokamaya/api-go/internal/repository"
)

func newUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

// AnalysisService menangani business logic simulasi spasial, formula skor, dan narasi AI.
type AnalysisService struct {
	spatialRepo *repository.SpatialRepository
	litellm     *client.LiteLLMClient
	osrm        *client.OSRMClient
}

func NewAnalysisService(
	spatialRepo *repository.SpatialRepository,
	litellm *client.LiteLLMClient,
	osrm *client.OSRMClient,
) *AnalysisService {
	return &AnalysisService{
		spatialRepo: spatialRepo,
		litellm:     litellm,
		osrm:        osrm,
	}
}

// RunSimulation menjalankan simulasi deterministik 3 skor + konteks survei + narasi AI.
func (s *AnalysisService) RunSimulation(ctx context.Context, req *model.SimulateRequest, userID *string) (*model.SimulationResult, error) {
	if req.StopName == "" {
		req.StopName = fmt.Sprintf("Kandidat Halte (%.4f, %.4f)", req.Latitude, req.Longitude)
	}

	// 1. Hitung Skor Akses Jalan Kaki
	walkScore, err := s.spatialRepo.CalculateWalkAccessibility(ctx, req.Latitude, req.Longitude)
	if err != nil {
		return nil, fmt.Errorf("gagal hitung skor jalan kaki: %w", err)
	}

	// 2. Hitung Skor Ekonomi UMKM
	umkmScore, err := s.spatialRepo.CalculateUMKMEconomic(ctx, req.Latitude, req.Longitude)
	if err != nil {
		return nil, fmt.Errorf("gagal hitung skor UMKM: %w", err)
	}

	// 3. Cek Kelayakan Lokasi (RDTR + Banjir)
	feasibility, err := s.spatialRepo.CheckFeasibility(ctx, req.Latitude, req.Longitude)
	if err != nil {
		return nil, fmt.Errorf("gagal cek kelayakan tata ruang: %w", err)
	}

	// 4. Cek Konektivitas Rute TransJakarta
	routeConn, err := s.spatialRepo.GetRouteConnectivity(ctx, req.Latitude, req.Longitude, req.ScenarioType)
	if err != nil {
		return nil, fmt.Errorf("gagal cek konektivitas rute: %w", err)
	}

	// 5. Cari Konteks Lapangan Terdekat (Survey Activities)
	surveyContext, err := s.spatialRepo.FindNearestSurveyActivity(ctx, req.Latitude, req.Longitude, 1200.0)
	if err != nil {
		surveyContext.HasSurveyData = false
	}

	// 6. Buat Narasi Analisis AI (Sintesis Kuantitatif + Kualitatif)
	aiNarrative := s.generateAINarrative(ctx, req, walkScore, umkmScore, feasibility, routeConn, surveyContext)

	simID := newUUID()
	res := &model.SimulationResult{
		ID:                 simID,
		ScenarioType:       req.ScenarioType,
		StopName:           req.StopName,
		Latitude:           req.Latitude,
		Longitude:          req.Longitude,
		WalkAccessibility:  walkScore,
		UMKMEconomic:       umkmScore,
		SiteFeasibility:    feasibility,
		RouteConnectivity:  routeConn,
		QualitativeContext: surveyContext,
		AINarrative:        aiNarrative,
		CreatedAt:          time.Now().Format(time.RFC3339),
	}

	// 7. Simpan ke database
	_ = s.spatialRepo.SaveSimulation(ctx, res, userID)

	return res, nil
}

// CompareScenarios membandingkan dua skenario secara side-by-side.
func (s *AnalysisService) CompareScenarios(ctx context.Context, req *model.CompareRequest, userID *string) (*model.CompareResult, error) {
	resA, err := s.RunSimulation(ctx, &req.ScenarioA, userID)
	if err != nil {
		return nil, fmt.Errorf("simulasi skenario A gagal: %w", err)
	}

	resB, err := s.RunSimulation(ctx, &req.ScenarioB, userID)
	if err != nil {
		return nil, fmt.Errorf("simulasi skenario B gagal: %w", err)
	}

	// Buat narasi komparatif otomatis
	narrative, recommended := s.generateComparativeNarrative(ctx, resA, resB)

	return &model.CompareResult{
		ScenarioA:            *resA,
		ScenarioB:            *resB,
		ComparativeNarrative: narrative,
		RecommendedScenario:  recommended,
	}, nil
}

func (s *AnalysisService) generateAINarrative(
	ctx context.Context,
	req *model.SimulateRequest,
	walk model.WalkScoreDetail,
	umkm model.UMKMScoreDetail,
	feasibility model.FeasibilityDetail,
	route model.RouteConnectivityDetail,
	survey model.QualitativeContext,
) string {
	prompt := fmt.Sprintf(`Kamu adalah LokaMaya AI Assistant. Tugasmu adalah menyusun narasi ringkas (maksimal 2 paragraf) berbahasa Indonesia yang profesional, jelas, dan berbasis fakta.
Skenario: %s (%s) di koordinat (%.4f, %.4f)
- Skor Akses Jalan Kaki: %d/100 (Kategori: %s, Est. Warga terjangkau 5-min: %d jiwa)
- Skor Ekonomi UMKM: %d/100 (Transaksi Struk Go: %d, PKL/Warung Informal: %d)
- Kelayakan Lokasi: Status %s di Zonasi %s (%s), Risiko Banjir: %s
- Rekomendasi Teknis: %s
- Konektivitas Rute: %d rute terhubung`,
		req.ScenarioType, req.StopName, req.Latitude, req.Longitude,
		walk.Score, walk.Category, walk.EstimatedReach5Min,
		umkm.Score, umkm.Category, umkm.StrukGoTransactions, umkm.InformalVendorCount,
		feasibility.Status, feasibility.ZoneCode, feasibility.ZoneName, feasibility.FloodRisk,
		feasibility.Recommendation, len(route.ConnectedRoutes),
	)

	if survey.HasSurveyData {
		prompt += fmt.Sprintf("\nData Observasi Lapangan Tim (%s, %d meter dari titik):\nCatatan: %s\nKendala Lapangan: %s\nPotensi: %s",
			survey.NearestSurveyPoint, survey.DistanceMeters, survey.FieldNotes, survey.PainPoints, survey.Potentials)
	}

	prompt += "\n\nATURAN KETAT: DILARANG mengarang angka atau fakta baru. Gunakan angka di atas untuk menyimpulkan trade-off penempatan halte secara objektif."

	messages := []client.ChatMessage{
		{Role: "system", Content: "Kamu adalah sistem Spatial Intelligence LokaMaya untuk Transportasi Massal."},
		{Role: "user", Content: prompt},
	}

	response, err := s.litellm.Complete(ctx, "gemini/gemini-1.5-flash", messages)
	if err != nil || response == "" {
		// Fallback narasi deterministik cerdas jika LiteLLM offline
		surveyNote := ""
		if survey.HasSurveyData {
			surveyNote = fmt.Sprintf(" Berdasarkan observasi lapangan di %s, %s", survey.NearestSurveyPoint, survey.FieldNotes)
		}

		return fmt.Sprintf(
			"Skenario %s pada %s menunjukkan performa akses jalan kaki sebesar %d/100 dengan jangkauan ~%d warga dalam 5 menit. Sektor ekonomi UMKM mencatatkan skor %d/100 didukung %d titik aktivitas usaha. Dari aspek kelayakan, lokasi berstatus %s (%s) dengan risiko banjir %s.%s Rekomendasi: %s",
			req.ScenarioType, req.StopName, walk.Score, walk.EstimatedReach5Min,
			umkm.Score, umkm.InformalVendorCount+umkm.FormalBusinessCount,
			feasibility.Status, feasibility.ZoneName, feasibility.FloodRisk,
			surveyNote, feasibility.Recommendation,
		)
	}

	return response
}

func (s *AnalysisService) generateComparativeNarrative(ctx context.Context, a, b *model.SimulationResult) (string, string) {
	scoreTotalA := a.WalkAccessibility.Score + a.UMKMEconomic.Score
	scoreTotalB := b.WalkAccessibility.Score + b.UMKMEconomic.Score

	recommended := "scenario_a"
	if scoreTotalB > scoreTotalA {
		recommended = "scenario_b"
	}

	prompt := fmt.Sprintf(`Bandingkan dua skenario halte TransJakarta berikut dalam 1-2 paragraf:
Skenario A (%s - %s): Akses %d/100, UMKM %d/100, Status %s, Banjir %s.
Skenario B (%s - %s): Akses %d/100, UMKM %d/100, Status %s, Banjir %s.
Jelaskan trade-off keduanya dan rekomendasikan skenario terbaik.`,
		a.ScenarioType, a.StopName, a.WalkAccessibility.Score, a.UMKMEconomic.Score, a.SiteFeasibility.Status, a.SiteFeasibility.FloodRisk,
		b.ScenarioType, b.StopName, b.WalkAccessibility.Score, b.UMKMEconomic.Score, b.SiteFeasibility.Status, b.SiteFeasibility.FloodRisk,
	)

	messages := []client.ChatMessage{
		{Role: "system", Content: "Kamu adalah AI Analis Spasial LokaMaya."},
		{Role: "user", Content: prompt},
	}

	resp, err := s.litellm.Complete(ctx, "gemini/gemini-1.5-flash", messages)
	if err != nil || resp == "" {
		better := a.StopName
		if recommended == "scenario_b" {
			better = b.StopName
		}
		return fmt.Sprintf(
			"Skenario %s lebih unggul secara akumulatif (Akses: %d vs %d, UMKM: %d vs %d). %s direkomendasikan sebagai pilihan prioritas untuk mendukung aksesibilitas pejalan kaki dan ekonomi warga sekitar.",
			better, a.WalkAccessibility.Score, b.WalkAccessibility.Score,
			a.UMKMEconomic.Score, b.UMKMEconomic.Score, better,
		), recommended
	}

	return resp, recommended
}
