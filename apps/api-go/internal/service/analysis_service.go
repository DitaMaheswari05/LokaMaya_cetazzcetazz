package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"sync"
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

// RunSimulationQuick menjalankan kalkulasi spasial komprehensif tanpa memanggil LLM eksternal (sangat cepat untuk batch / Pareto candidate search).
func (s *AnalysisService) RunSimulationQuick(ctx context.Context, req *model.SimulateRequest, userID *string) (*model.SimulationResult, error) {
	isGenericName := req.StopName == "" ||
		strings.Contains(req.StopName, "Halte Usulan (-") ||
		strings.Contains(req.StopName, "Kandidat Halte (-") ||
		strings.Contains(req.StopName, "Halte Usulan (") ||
		strings.HasPrefix(req.StopName, "-")

	if req.StopName == "" {
		req.StopName = fmt.Sprintf("Halte Usulan (%.4f, %.4f)", req.Latitude, req.Longitude)
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

	// 4. Cek Konektivitas Rute TransJakarta & Bentuk Perbandingan Rute As-Is vs To-Be
	routeConn, err := s.spatialRepo.GetRouteConnectivity(ctx, req.Latitude, req.Longitude, req.ScenarioType)
	if err != nil {
		return nil, fmt.Errorf("gagal cek konektivitas rute: %w", err)
	}

	routeComp, _ := s.spatialRepo.GenerateRouteComparison(ctx, req.Latitude, req.Longitude, req.ScenarioType, req.StopName)

	// Resolusi nama daerah yang cerdas & manusiawi jika nama sebelumnya generik koordinat
	if isGenericName {
		resolvedName := s.resolveAreaName(req.Latitude, req.Longitude, feasibility.ZoneName, routeComp)
		req.StopName = resolvedName
		if routeComp != nil {
			routeComp.ChangedSegment = strings.ReplaceAll(routeComp.ChangedSegment, "Halte Usulan", resolvedName)
			routeComp.Summary = strings.ReplaceAll(routeComp.Summary, "Halte Usulan", resolvedName)
			for i := range routeComp.ToBeStops {
				if routeComp.ToBeStops[i].IsSimulated {
					routeComp.ToBeStops[i].Name = resolvedName
				}
			}
		}
	}

	// 5. Cari Konteks Lapangan Terdekat (Survey Activities)
	surveyContext, err := s.spatialRepo.FindNearestSurveyActivity(ctx, req.Latitude, req.Longitude, 1200.0)
	if err != nil {
		surveyContext.HasSurveyData = false
	}

	// 6. Hitung Prediksi Efek Domino Perilaku (Behavioral Ripple Effect)
	var ojolShift int = 14
	if walkScore.Score < 60 {
		ojolShift += (60 - walkScore.Score) / 2
	}
	if routeComp != nil && routeComp.DeltaDistanceMeters > 200 {
		ojolShift += int(routeComp.DeltaDistanceMeters / 100.0)
	}
	if ojolShift > 45 {
		ojolShift = 45
	}

	walkImpact := "Jangkauan pedestrian terjaga dalam radius nyaman 400 meter."
	if walkScore.Score < 55 {
		walkImpact = fmt.Sprintf("Waktu jalan kaki bertambah ~%d menit, memicu potensi kelelahan pedestrian dan kebutuhan peneduh jalan.", int(math.Round(float64(100-walkScore.Score)/10.0)))
	}

	vendorTurnover := "Aktivitas UMKM lokal diproyeksikan stabil dengan arus pembeli komuter tetap mengalir."
	if req.ScenarioType == "pindah" || req.ScenarioType == "tutup" {
		vendorTurnover = "Sentra lama diproyeksikan mengalami penurunan perputaran pembeli ~20-30%, sedangkan titik baru berpotensi memunculkan simpul pedagang baru dalam 1-2 bulan."
	} else if umkmScore.Score > 75 {
		vendorTurnover = "Arus transit baru diestimasikan meningkatkan omset warung dan pedagang kaki lima sekitar sebesar ~15-25%."
	}

	behavioralRipple := &model.BehavioralRippleDetail{
		ModalShiftOjolPercent:  ojolShift,
		WalkCommuterImpact:     walkImpact,
		InformalVendorTurnover: vendorTurnover,
		Summary:                fmt.Sprintf("Pergeseran moda ojol diproyeksikan ~%d%% dengan dinamika perubahan arus pejalan kaki dan omset pedagang sekitar.", ojolShift),
	}

	simID := newUUID()
	aiNarrative := fmt.Sprintf("Titik %s memiliki skor akses pejalan kaki %d/100 (%s, jangkauan 5 menit ~%d jiwa) dan skor ekonomi UMKM %d/100 (%s, %d PKL/warung). Kepatuhan zonasi RDTR berstatus %s (%s) dengan risiko genangan %s.",
		req.StopName, walkScore.Score, walkScore.Category, walkScore.EstimatedReach5Min,
		umkmScore.Score, umkmScore.Category, umkmScore.InformalVendorCount,
		feasibility.Status, feasibility.ZoneName, feasibility.FloodRisk)

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
		RouteComparison:    routeComp,
		BehavioralRipple:   behavioralRipple,
		QualitativeContext: surveyContext,
		AINarrative:        aiNarrative,
		CreatedAt:          time.Now().Format(time.RFC3339),
	}

	res.Deliberation = s.calculateDeterministicDeliberation(res)
	return res, nil
}

// RunSimulation menjalankan simulasi deterministik 3 skor + konteks survei + narasi AI lengkap (termasuk deliberation & policy brief).
func (s *AnalysisService) RunSimulation(ctx context.Context, req *model.SimulateRequest, userID *string) (*model.SimulationResult, error) {
	res, err := s.RunSimulationQuick(ctx, req, userID)
	if err != nil {
		return nil, err
	}

	// Buat Narasi Analisis AI (Sintesis Kuantitatif + Kualitatif) melalui LLM
	aiNarrative := s.generateAINarrative(ctx, req, res.WalkAccessibility, res.UMKMEconomic, res.SiteFeasibility, res.RouteConnectivity, res.RouteComparison, res.QualitativeContext)
	if aiNarrative != "" {
		res.AINarrative = aiNarrative
	}

	// Eksekusi Musyawarah AI Urban Council 3 Persona (Warga, UMKM, Dishub) melalui LLM
	delib, _ := s.DeliberateStakeholders(ctx, res)
	if delib != nil {
		res.Deliberation = delib
	}

	// Susun Naskah Advokasi Kebijakan Formal Pemprov DKI (Policy Brief)
	brief, _ := s.GeneratePolicyBrief(ctx, res)
	res.PolicyBrief = brief

	// Simpan ke database
	_ = s.spatialRepo.SaveSimulation(ctx, res, userID)

	return res, nil
}

// CompareScenarios membandingkan dua skenario secara side-by-side secara concurrent.
func (s *AnalysisService) CompareScenarios(ctx context.Context, req *model.CompareRequest, userID *string) (*model.CompareResult, error) {
	var resA, resB *model.SimulationResult
	var errA, errB error
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		resA, errA = s.RunSimulation(ctx, &req.ScenarioA, userID)
	}()
	go func() {
		defer wg.Done()
		resB, errB = s.RunSimulation(ctx, &req.ScenarioB, userID)
	}()
	wg.Wait()

	if errA != nil {
		return nil, fmt.Errorf("simulasi skenario A gagal: %w", errA)
	}
	if errB != nil {
		return nil, fmt.Errorf("simulasi skenario B gagal: %w", errB)
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
	routeComp *model.RouteComparisonDetail,
	survey model.QualitativeContext,
) string {
	prompt := fmt.Sprintf(`Kamu adalah LokaMaya AI Assistant. Tugasmu adalah menyusun narasi ringkas (maksimal 2 paragraf) berbahasa Indonesia yang profesional, jelas, dan berbasis fakta.
Skenario: %s (%s) di koordinat (%.4f, %.4f)
- Skor Akses Jalan Kaki: %d/100 (Kategori: %s, Est. Warga terjangkau 5-min: %d jiwa)
- Skor Ekonomi UMKM: %d/100 (Kategori: %s, Transaksi Struk Go: %d, PKL/Warung Informal: %d)
- Kelayakan Lokasi: Status %s di Zonasi %s (%s), Risiko Banjir: %s
- Rekomendasi Teknis: %s
- Konektivitas Rute: %d rute terhubung`,
		req.ScenarioType, req.StopName, req.Latitude, req.Longitude,
		walk.Score, walk.Category, walk.EstimatedReach5Min,
		umkm.Score, umkm.Category, umkm.StrukGoTransactions, umkm.InformalVendorCount,
		feasibility.Status, feasibility.ZoneCode, feasibility.ZoneName, feasibility.FloodRisk,
		feasibility.Recommendation, len(route.ConnectedRoutes),
	)

	if routeComp != nil {
		prompt += fmt.Sprintf("\n- Perubahan Rute BRT TransJakarta As-Is vs To-Be: Koridor %s (%s, Arah: %s).\n  Segmen halte terdampak: %s.\n  Dampak operasional: Delta Jarak %+.0fm, Delta Waktu Tempuh %+.1f menit (%s).",
			routeComp.PrimaryRouteCode, routeComp.PrimaryRouteName, routeComp.Direction,
			routeComp.ChangedSegment, routeComp.DeltaDistanceMeters, routeComp.DeltaTravelTimeMinutes, routeComp.Summary)
	}

	if survey.HasSurveyData {
		prompt += fmt.Sprintf("\nData Observasi Lapangan Tim (%s, %d meter dari titik):\nCatatan: %s\nKendala Lapangan: %s\nPotensi: %s",
			survey.NearestSurveyPoint, survey.DistanceMeters, survey.FieldNotes, survey.PainPoints, survey.Potentials)
	}

	prompt += "\n\nATURAN KETAT: DILARANG mengarang angka atau fakta baru. Gunakan angka di atas untuk menyimpulkan trade-off penempatan halte secara objektif."

	messages := []client.ChatMessage{
		{Role: "system", Content: "Kamu adalah sistem Spatial Intelligence LokaMaya untuk Transportasi Massal."},
		{Role: "user", Content: prompt},
	}

	response, err := s.litellm.Complete(ctx, client.DefaultModel, messages)
	if err != nil || response == "" {
		// Fallback narasi deterministik cerdas jika LiteLLM offline
		surveyNote := ""
		if survey.HasSurveyData {
			surveyNote = fmt.Sprintf(" Berdasarkan observasi lapangan di %s, %s", survey.NearestSurveyPoint, survey.FieldNotes)
		}

		routeNote := ""
		if routeComp != nil {
			routeNote = fmt.Sprintf(" Pada Koridor %s (%s), rute mengalami perubahan segmen halte: %s (%s).",
				routeComp.PrimaryRouteCode, routeComp.PrimaryRouteName, routeComp.ChangedSegment, routeComp.Summary)
		}

		return fmt.Sprintf(
			"Skenario %s pada %s menunjukkan performa akses jalan kaki sebesar %d/100 dengan jangkauan ~%d warga dalam 5 menit. Sektor ekonomi UMKM mencatatkan skor %d/100 didukung %d titik aktivitas usaha. Dari aspek kelayakan, lokasi berstatus %s (%s) dengan risiko banjir %s.%s%s Rekomendasi: %s",
			req.ScenarioType, req.StopName, walk.Score, walk.EstimatedReach5Min,
			umkm.Score, umkm.InformalVendorCount+umkm.FormalBusinessCount,
			feasibility.Status, feasibility.ZoneName, feasibility.FloodRisk,
			routeNote, surveyNote, feasibility.Recommendation,
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

	resp, err := s.litellm.Complete(ctx, client.DefaultModel, messages)
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

// DeliberateStakeholders menjalankan simulasi musyawarah AI Urban Council (Warga, UMKM, Dishub).
func (s *AnalysisService) DeliberateStakeholders(ctx context.Context, sim *model.SimulationResult) (*model.DeliberationResult, error) {
	corridorInfo := ""
	if sim.RouteComparison != nil {
		corridorInfo = fmt.Sprintf("\n- Koridor BRT: %s (%s)\n- Segmen Rute Terdampak: %s\n- Delta Jarak Detour: +%.0fm (Delta Waktu Tempuh: +%.1f menit)",
			sim.RouteComparison.PrimaryRouteName, sim.RouteComparison.PrimaryRouteCode,
			sim.RouteComparison.ChangedSegment,
			sim.RouteComparison.DeltaDistanceMeters, sim.RouteComparison.DeltaTravelTimeMinutes)
	}

	surveyInfo := ""
	if sim.QualitativeContext.HasSurveyData {
		surveyInfo = fmt.Sprintf("\n- Observasi Lapangan: %s\n- Titik Halte Sekitar: %s\n- Masalah Utama Pejalan Kaki (Pain Points): %s\n- Potensi Wilayah: %s",
			sim.QualitativeContext.FieldNotes, sim.QualitativeContext.NearestSurveyPoint,
			sim.QualitativeContext.PainPoints, sim.QualitativeContext.Potentials)
	}

	rippleInfo := ""
	if sim.BehavioralRipple != nil {
		rippleInfo = fmt.Sprintf("\n- Proyeksi Efek Domino: ~%d%% pengguna ojek online beralih ke bus. %s %s",
			sim.BehavioralRipple.ModalShiftOjolPercent, sim.BehavioralRipple.WalkCommuterImpact, sim.BehavioralRipple.InformalVendorTurnover)
	}

	prompt := fmt.Sprintf(`Kamu adalah simulator musyawarah AI Urban Council Jakarta yang kritis, tajam, dan realistis. Tiga pihak sedang berdialog sengit mengenai usulan penataan halte TransJakarta:
Lokasi: %s (%s) di koordinat (%.5f, %.5f)
- Skor Akses Jalan Kaki: %d/100 (%s), perkiraan jangkauan 5 mnt: %d jiwa, 10 mnt: %d jiwa
- Skor Ekonomi UMKM: %d/100 (%s), terdata %d transaksi dan %d lapak pedagang kaki lima/informal
- Kesesuaian Tata Ruang (Perda 1/2024): %s (Zonasi: %s - %s)
- Tingkat Risiko Banjir: %s
- Rekomendasi Teknis: %s%s%s%s

TUGAS UTAMA:
Berikan hasil musyawarah yang SANGAT MENDALAM, KONKRET, SPESIFIK, dan REALISTIS. DILARANG menggunakan kalimat klise umum ("Saya senang...", "Lokasi ini sangat ideal").
1. Rina (Warga & Komuter Pejalan Kaki): Bicara sebagai pengguna transportasi harian warga Jakarta. Soroti keselamatan menyeberang jalan arteri yang padat, kondisi trotoar, penerangan malam hari, kelelahan berjalan, atau keterhubungan dengan jembatan penyeberangan (JPO).
2. Siti (Pelaku UMKM / PKL): Bicara sebagai pedagang riil yang mencari nafkah. Soroti potensi pembeli komuter vs ketakutan digusur Satpol PP, menuntut jatah lapak kuliner teratur di dekat halte tanpa memblokir jalan.
3. Andi (Perencana Transportasi Dishub DKI): Bicara teknis regulasi, headway bus, konsekuensi dwell time (+waktu tempuh bagi penumpang transit), sempadan jalan, integrasi JakLingko, dan mitigasi banjir (lantai halte elevated).

Berikan output JSON murni tanpa markdown/backticks dengan format:
{
  "social_acceptance_rate": 80,
  "consensus_level": "Tinggi",
  "stakeholders": [
    {
      "persona": "Rina (Warga)",
      "role": "Komuter Pejalan Kaki",
      "stance": "Mendukung Bersyarat",
      "quote": "Kutipan langsung dari Rina yang tajam dan menyebutkan fakta rute/kondisi jalan...",
      "key_reason": "Alasan utama..."
    },
    {
      "persona": "Siti (Pelaku UMKM)",
      "role": "Pelaku Usaha Mikro",
      "stance": "Mendukung Bersyarat",
      "quote": "Kutipan langsung dari Siti mengenai omset dan ruang lapak tanpa penggusuran...",
      "key_reason": "Alasan utama..."
    },
    {
      "persona": "Andi (Dishub)",
      "role": "Perencana Transportasi",
      "stance": "Mendukung Bersyarat",
      "quote": "Kutipan pertimbangan teknis Dishub mengenai headway rute dan mitigasi...",
      "key_reason": "Alasan utama..."
    }
  ],
  "compromise_solution": "Solusi kompromi 3 poin yang konkret, implementatif, dan menjawab kekhawatiran ketiga pihak..."
}`,
		sim.StopName, sim.ScenarioType, sim.Latitude, sim.Longitude,
		sim.WalkAccessibility.Score, sim.WalkAccessibility.Category, sim.WalkAccessibility.EstimatedReach5Min, sim.WalkAccessibility.EstimatedReach10Min,
		sim.UMKMEconomic.Score, sim.UMKMEconomic.Category, sim.UMKMEconomic.StrukGoTransactions, sim.UMKMEconomic.InformalVendorCount,
		sim.SiteFeasibility.Status, sim.SiteFeasibility.ZoneCode, sim.SiteFeasibility.ZoneName,
		sim.SiteFeasibility.FloodRisk, sim.SiteFeasibility.Recommendation,
		corridorInfo, surveyInfo, rippleInfo,
	)

	messages := []client.ChatMessage{
		{Role: "system", Content: "Kamu adalah AI Urban Council Jakarta. Analisis harus kritis, berbasis fakta spasial lokal, dan tidak boleh klise. Jawab HANYA dengan JSON valid."},
		{Role: "user", Content: prompt},
	}

	resp, err := s.litellm.Complete(ctx, client.DefaultModel, messages)
	if err == nil && resp != "" {
		cleaned := strings.TrimSpace(resp)
		cleaned = strings.TrimPrefix(cleaned, "```json")
		cleaned = strings.TrimPrefix(cleaned, "```")
		cleaned = strings.TrimSuffix(cleaned, "```")
		cleaned = strings.TrimSpace(cleaned)

		var result model.DeliberationResult
		if err := json.Unmarshal([]byte(cleaned), &result); err == nil && len(result.Stakeholders) >= 3 {
			result.SimulationID = sim.ID
			return &result, nil
		}
	}

	// Fallback deterministik berbasis data riil jika AI offline
	res := s.calculateDeterministicDeliberation(sim)
	return res, nil
}

// calculateDeterministicDeliberation menghitung hasil musyawarah 3 persona secara deterministik berbasis data spasial riil tanpa jeda waktu LLM.
func (s *AnalysisService) calculateDeterministicDeliberation(sim *model.SimulationResult) *model.DeliberationResult {
	rate := (sim.WalkAccessibility.Score + sim.UMKMEconomic.Score) / 2
	if sim.SiteFeasibility.Status == "Tidak Sesuai" {
		rate -= 25
	} else if sim.SiteFeasibility.Status == "Bersyarat" {
		rate -= 10
	}
	if sim.SiteFeasibility.FloodRisk == "Tinggi" || sim.SiteFeasibility.FloodRisk == "Sangat Tinggi" {
		rate -= 10
	}
	if rate < 35 {
		rate = 35
	} else if rate > 95 {
		rate = 95
	}

	consensus := "Tinggi"
	if rate < 60 {
		consensus = "Rendah"
	} else if rate < 78 {
		consensus = "Sedang"
	}

	ruteName := "Koridor TransJakarta"
	segmentName := "jalur arteri eksisting"
	if sim.RouteComparison != nil && sim.RouteComparison.PrimaryRouteName != "" {
		ruteName = sim.RouteComparison.PrimaryRouteName
		segmentName = sim.RouteComparison.ChangedSegment
	}

	rinaQuote := fmt.Sprintf("Bagi kami pejalan kaki, halte di %s ini memangkas jalan kaki hingga 400 meter. Namun kami minta penyeberangan zebra cross berlampu atau akses ke JPO segera dipasang, karena menyeberangi jalur arteri di jam sibuk sangat berbahaya.", sim.StopName)
	if sim.QualitativeContext.PainPoints != "" {
		rinaQuote = fmt.Sprintf("Kami menyambut halte di %s, apalagi untuk akses ke %s. Tapi tolong dengar keluhan warga: %s. Jangan sampai halte jadi tapi akses jalan kakinya gelap dan membahayakan warga.", sim.StopName, ruteName, sim.QualitativeContext.PainPoints)
	}

	sitiQuote := fmt.Sprintf("Di sekitar sini ada %d pedagang kaki lima dan warung aktif. Kehadiran ribuan penumpang tentu berkah, tapi tolong Satpol PP jangan langsung menggusur! Beri kami 3-4 stan binaan UMKM terpadu di samping halte agar kami bisa berniaga resmi.", sim.UMKMEconomic.InformalVendorCount)
	if sim.UMKMEconomic.InformalVendorCount == 0 {
		sitiQuote = "Kawasan ini butuh titik UMKM resmi terintegrasi agar para komuter pagi bisa membeli sarapan dan kebutuhan harian tanpa mengganggu sirkulasi trotoar."
	}

	andiQuote := fmt.Sprintf("Dari sisi Dishub, penambahan perhentian pada %s (segmen %s) menambah dwell time sekitar +%.1f menit bagi penumpang jarak jauh. Namun karena kesesuaian zonasi %s berstatus %s, usulan ini layak disetujui asalkan lantai halte dinaikkan minimal 40 cm untuk mengantisipasi risiko banjir %s.", ruteName, segmentName, 1.5, sim.SiteFeasibility.ZoneCode, sim.SiteFeasibility.Status, sim.SiteFeasibility.FloodRisk)

	compromise := fmt.Sprintf("1) Membangun Halte %s dengan desain platform panggung elevated (tahan genangan air %s). 2) Menyediakan fasilitas penyeberangan aman berlampu atau akses ramp JPO bagi pejalan kaki. 3) Mengalokasikan zona terkurasi untuk %d UMKM binaan di sempadan jalan tanpa mempersempit lebar efektif trotoar pejalan kaki.", sim.StopName, sim.SiteFeasibility.FloodRisk, sim.UMKMEconomic.InformalVendorCount)

	return &model.DeliberationResult{
		SimulationID:         sim.ID,
		SocialAcceptanceRate: rate,
		ConsensusLevel:       consensus,
		Stakeholders: []model.StakeholderOpinion{
			{
				Persona:   "Rina (Warga)",
				Role:      "Komuter Pejalan Kaki",
				Stance:    "Mendukung Bersyarat",
				Quote:     rinaQuote,
				KeyReason: "Membutuhkan jaminan keselamatan penyeberangan dan trotoar layak.",
			},
			{
				Persona:   "Siti (Pelaku UMKM)",
				Role:      "Pelaku Usaha Mikro",
				Stance:    "Mendukung Bersyarat",
				Quote:     sitiQuote,
				KeyReason: "Menuntut kepastian relokasi kios binaan tanpa penggusuran sepihak.",
			},
			{
				Persona:   "Andi (Dishub)",
				Role:      "Perencana Transportasi",
				Stance:    "Mendukung Bersyarat",
				Quote:     andiQuote,
				KeyReason: "Menyeimbangkan dwell time bus dengan konstruksi mitigasi banjir.",
			},
		},
		CompromiseSolution: compromise,
	}
}

// FindOptimalStops melakukan pencarian titik halte Pareto-optimal secara otonom di sepanjang koridor.
func (s *AnalysisService) FindOptimalStops(ctx context.Context, corridorName string, centerLat, centerLng float64, userID *string) (*model.OptimalSearchResponse, error) {
	// Buat sampel titik koordinat di sepanjang koridor
	type samplePoint struct {
		name string
		lat  float64
		lng  float64
	}

	var samples []samplePoint

	cLower := strings.ToLower(corridorName)
	if strings.Contains(cLower, "sudirman") || strings.Contains(cLower, "thamrin") {
		samples = []samplePoint{
			{"Kandidat Sudirman Utara (Depan Chase Plaza)", -6.2120, 106.8210},
			{"Kandidat Sudirman Tengah (Dekat fX)", -6.2230, 106.8050},
			{"Kandidat Sudirman Selatan (Depan Menara Mandiri)", -6.2260, 106.8030},
			{"Kandidat Sudirman Benhil (Dekat Sentra Kuliner)", -6.2165, 106.8190},
			{"Kandidat Semanggi Interchange (Sisi Barat)", -6.2195, 106.8130},
		}
	} else if strings.Contains(cLower, "gatot subroto") || strings.Contains(cLower, "gatsu") {
		samples = []samplePoint{
			{"Kandidat Gatsu Barat (Depan Grha BPJamsostek)", -6.2310, 106.8160},
			{"Kandidat Gatsu Tengah (Dekat Tempo Scan)", -6.2380, 106.8300},
			{"Kandidat Gatsu Simpang Kuningan", -6.2395, 106.8330},
			{"Kandidat Gatsu Pancoran (Sisi Selatan)", -6.2420, 106.8400},
			{"Kandidat Slipi Menara Peninsula", -6.1950, 106.7980},
		}
	} else if strings.Contains(cLower, "daan mogot") || strings.Contains(cLower, "grogol") {
		samples = []samplePoint{
			{"Kandidat Daan Mogot Km 2 (Dekat Indosiar)", -6.1620, 106.7650},
			{"Kandidat Jelambar Baru (Dekat Kampus)", -6.1670, 106.7880},
			{"Kandidat Grogol Mall Ciputra", -6.1680, 106.7860},
			{"Kandidat Tanjung Duren Timur", -6.1760, 106.7910},
			{"Kandidat Pesing Poglar", -6.1580, 106.7720},
		}
	} else {
		// Default: Gunakan center koordinat dengan offset delta radius ~300-600m
		if centerLat == 0 && centerLng == 0 {
			centerLat, centerLng = -6.2200, 106.8200 // Default segitiga emas Jakarta
		}
		displayName := corridorName
		if displayName == "" || strings.Contains(strings.ToLower(displayName), "daerah ini") || strings.Contains(strings.ToLower(displayName), "area ini") {
			displayName = "Wilayah Sekitar"
		}
		samples = []samplePoint{
			{fmt.Sprintf("Kandidat %s Utara (%.4f, %.4f)", displayName, centerLat+0.003, centerLng-0.001), centerLat + 0.003, centerLng - 0.001},
			{fmt.Sprintf("Kandidat %s Timur (%.4f, %.4f)", displayName, centerLat-0.001, centerLng+0.003), centerLat - 0.001, centerLng + 0.003},
			{fmt.Sprintf("Kandidat %s Sentral (%.4f, %.4f)", displayName, centerLat, centerLng), centerLat, centerLng},
			{fmt.Sprintf("Kandidat %s Selatan (%.4f, %.4f)", displayName, centerLat-0.003, centerLng-0.002), centerLat - 0.003, centerLng - 0.002},
			{fmt.Sprintf("Kandidat %s Barat (%.4f, %.4f)", displayName, centerLat+0.001, centerLng-0.003), centerLat + 0.001, centerLng - 0.003},
		}
	}

	// Jalankan kalkulasi batch secara paralel menggunakan Goroutines (RunSimulationQuick tanpa LLM)
	results := make([]*model.SimulationResult, len(samples))
	var wg sync.WaitGroup
	for i, sp := range samples {
		wg.Add(1)
		go func(idx int, p samplePoint) {
			defer wg.Done()
			simReq := &model.SimulateRequest{
				Latitude:     p.lat,
				Longitude:    p.lng,
				ScenarioType: "tambah",
				StopName:     p.name,
			}
			res, err := s.RunSimulationQuick(ctx, simReq, userID)
			if err == nil {
				results[idx] = res
			}
		}(i, sp)
	}
	wg.Wait()

	// Filter 3 Pareto-Optimal Candidates
	var bestWalk, bestUMKM, bestResilient *model.SimulationResult
	maxWalk, maxUMKM, maxComp := -1, -1, -1

	for _, r := range results {
		if r == nil {
			continue
		}
		if r.WalkAccessibility.Score > maxWalk {
			maxWalk = r.WalkAccessibility.Score
			bestWalk = r
		}
		if r.UMKMEconomic.Score > maxUMKM {
			maxUMKM = r.UMKMEconomic.Score
			bestUMKM = r
		}
		comp := r.WalkAccessibility.Score + r.UMKMEconomic.Score
		if r.SiteFeasibility.Status == "Sesuai" {
			comp += 20
		}
		if r.SiteFeasibility.FloodRisk == "Rendah" {
			comp += 15
		}
		if comp > maxComp {
			maxComp = comp
			bestResilient = r
		}
	}

	var candidates []model.OptimalStopCandidate
	if bestWalk != nil {
		candidates = append(candidates, model.OptimalStopCandidate{
			Rank:             1,
			Title:            "Pilihan Warga (Aksesibilitas Pejalan Kaki Tertinggi)",
			Latitude:         bestWalk.Latitude,
			Longitude:        bestWalk.Longitude,
			SimulationResult: *bestWalk,
			Reason:           fmt.Sprintf("Mencapai skor jalan kaki tertinggi (%d/100) dengan estimasi %d warga terlayani dalam 5 menit.", bestWalk.WalkAccessibility.Score, bestWalk.WalkAccessibility.EstimatedReach5Min),
		})
	}
	if bestUMKM != nil && (bestWalk == nil || bestUMKM.ID != bestWalk.ID) {
		candidates = append(candidates, model.OptimalStopCandidate{
			Rank:             2,
			Title:            "Pilihan Ekonomi (Kepadatan UMKM & Bisnis Lokal)",
			Latitude:         bestUMKM.Latitude,
			Longitude:        bestUMKM.Longitude,
			SimulationResult: *bestUMKM,
			Reason:           fmt.Sprintf("Mencapai potensi ekonomi tertinggi (%d/100) bersinggungan langsung dengan sentra usaha informal dan transaksi lokal aktif.", bestUMKM.UMKMEconomic.Score),
		})
	}
	if bestResilient != nil {
		candidates = append(candidates, model.OptimalStopCandidate{
			Rank:             len(candidates) + 1,
			Title:            "Pilihan Resilien (Kepatuhan Zonasi & Bebas Banjir)",
			Latitude:         bestResilient.Latitude,
			Longitude:        bestResilient.Longitude,
			SimulationResult: *bestResilient,
			Reason:           fmt.Sprintf("Lokasi paling aman dengan kepatuhan zonasi RDTR %s dan risiko genangan %s.", bestResilient.SiteFeasibility.Status, bestResilient.SiteFeasibility.FloodRisk),
		})
	}

	return &model.OptimalSearchResponse{
		CorridorName:  corridorName,
		TotalSampled:  len(samples),
		TopCandidates: candidates,
	}, nil
}

// GeneratePolicyBrief menyusun naskah advokasi kebijakan formal siap serah.
func (s *AnalysisService) GeneratePolicyBrief(ctx context.Context, sim *model.SimulationResult) (string, error) {
	brief := fmt.Sprintf(`# NASKAH ADVOKASI KEBIJAKAN PENATAAN TRANSIT (POLICY BRIEF)
**Usulan Penataan Halte TransJakarta: %s**
*Dokumen Rekomendasi Spasial LokaMaya Spatial Intelligence Platform*

---

### 1. RINGKASAN EKSEKUTIF
Berdasarkan evaluasi spasial terpadu, usulan skenario **%s** untuk **%s** pada koordinat **(%.5f, %.5f)** menghasilkan:
- **Indeks Aksesibilitas Pejalan Kaki:** %d / 100 (%s)
- **Indeks Dampak Ekonomi UMKM:** %d / 100 (%s)
- **Kesesuaian Tata Ruang (RDTR 2022):** %s (%s)
- **Tingkat Risiko Genangan Banjir:** %s

### 2. DASAR HUKUM DAN KESESUAIAN TATA RUANG
1. **Peraturan Daerah DKI Jakarta No. 1 Tahun 2024 tentang RDTR Wilayah Perencanaan DKI Jakarta:**
   Lokasi usulan berada pada peruntukan lahan **%s (%s)** dengan status kesesuaian **%s**.
2. **Konektivitas Rute Koridor:** Skenario ini mempertahankan keterhubungan %d rute operasional TransJakarta.

### 3. ANALISIS DAMPAK SOSIO-EKONOMI MASYARAKAT
- **Pejalan Kaki:** Diestimasikan melayani hingga %d warga dalam radius 5 menit (~400 meter) dan %d warga dalam radius 10 menit (~800 meter).
- **Usaha Mikro (UMKM):** Terdeteksi %d transaksi harian aktif dan %d pedagang kuliner/informal sekitar simpul transit.

### 4. REKOMENDASI REKAYASA & MITIGASI PEMPROV DKI
%s

---
*Diterbitkan otomatis oleh LokaMaya Platform pada %s sebagai data pendukung aspirasi kebijakan publik.*`,
		sim.StopName,
		strings.ToUpper(sim.ScenarioType), sim.StopName, sim.Latitude, sim.Longitude,
		sim.WalkAccessibility.Score, strings.ToUpper(sim.WalkAccessibility.Category),
		sim.UMKMEconomic.Score, strings.ToUpper(sim.UMKMEconomic.Category),
		sim.SiteFeasibility.Status, sim.SiteFeasibility.ZoneName,
		sim.SiteFeasibility.FloodRisk,
		sim.SiteFeasibility.ZoneCode, sim.SiteFeasibility.ZoneName, sim.SiteFeasibility.Status,
		len(sim.RouteConnectivity.ConnectedRoutes),
		sim.WalkAccessibility.EstimatedReach5Min, sim.WalkAccessibility.EstimatedReach10Min,
		sim.UMKMEconomic.StrukGoTransactions, sim.UMKMEconomic.InformalVendorCount,
		sim.SiteFeasibility.Recommendation,
		sim.CreatedAt,
	)

	return brief, nil
}

// resolveAreaName menghasilkan nama lokasi usulan yang manusiawi & berbasis daerah/koridor riil
func (s *AnalysisService) resolveAreaName(lat, lng float64, zoneName string, routeComp *model.RouteComparisonDetail) string {
	kecamatan := ""
	upperZone := strings.ToUpper(zoneName)
	if idx := strings.Index(upperZone, "KEC."); idx != -1 {
		parts := strings.Split(zoneName[idx+4:], "-")
		if len(parts) > 0 {
			kec := strings.TrimSpace(parts[0])
			kecamatan = strings.Title(strings.ToLower(kec))
		}
	}

	corridor := ""
	nearestStop := ""
	if routeComp != nil {
		if routeComp.PrimaryRouteName != "" {
			cName := routeComp.PrimaryRouteName
			if strings.Contains(cName, "(") && strings.Contains(cName, ")") {
				cName = cName[strings.Index(cName, "(")+1 : strings.Index(cName, ")")]
			}
			corridor = cName
		}
		if routeComp.ChangedSegment != "" {
			segs := strings.Split(routeComp.ChangedSegment, "→")
			if len(segs) >= 1 {
				nearestStop = strings.TrimSpace(segs[0])
			}
		}
	}

	landmark := ""
	switch {
	case lat >= -6.1700 && lat <= -6.1400 && lng >= 106.7000 && lng <= 106.7750:
		landmark = "Daan Mogot"
	case lat >= -6.1850 && lat <= -6.1600 && lng >= 106.7750 && lng <= 106.8000:
		landmark = "Grogol / Tomang"
	case lat >= -6.2350 && lat <= -6.2050 && lng >= 106.8000 && lng <= 106.8300:
		landmark = "Sudirman - Semanggi"
	case lat >= -6.2500 && lat <= -6.2300 && lng >= 106.8100 && lng <= 106.8500:
		landmark = "Gatot Subroto / Kuningan"
	case lat >= -6.2000 && lat <= -6.1650 && lng >= 106.8150 && lng <= 106.8400:
		landmark = "Thamrin - Monas"
	case lat >= -6.2550 && lat <= -6.2350 && lng >= 106.7850 && lng <= 106.8150:
		landmark = "Blok M / Kebayoran"
	case lat >= -6.1500 && lat <= -6.1200 && lng >= 106.8000 && lng <= 106.8400:
		landmark = "Kota Tua / Glodok"
	}

	if landmark != "" && nearestStop != "" {
		if kecamatan != "" {
			return fmt.Sprintf("Halte Usulan %s (Kec. %s - Dekat %s)", landmark, kecamatan, nearestStop)
		}
		return fmt.Sprintf("Halte Usulan %s (Dekat %s)", landmark, nearestStop)
	} else if landmark != "" {
		if kecamatan != "" {
			return fmt.Sprintf("Halte Usulan %s (Kec. %s)", landmark, kecamatan)
		}
		return fmt.Sprintf("Halte Usulan Koridor %s", landmark)
	} else if nearestStop != "" {
		if kecamatan != "" {
			return fmt.Sprintf("Halte Usulan Dekat %s (Kec. %s)", nearestStop, kecamatan)
		}
		return fmt.Sprintf("Halte Usulan Dekat %s", nearestStop)
	} else if kecamatan != "" {
		return fmt.Sprintf("Halte Usulan Kawasan %s", kecamatan)
	} else if corridor != "" {
		return fmt.Sprintf("Halte Usulan Koridor %s", corridor)
	}

	return fmt.Sprintf("Halte Usulan Kawasan Transit (%.4f, %.4f)", lat, lng)
}

func formatJourneyStepsText(steps []model.JourneyStep) string {
	var sb strings.Builder
	for _, s := range steps {
		icon := "🚶"
		if s.Mode == "bus" {
			icon = "🚌"
		} else if s.Mode == "transfer" {
			icon = "🔄"
		}
		sb.WriteString(fmt.Sprintf("%d. %s **%s**: %s (Jarak: %.0fm, Durasi: ~%d menit)\n",
			s.StepNumber, icon, s.Title, s.Description, s.DistanceMeters, s.DurationMinutes))
	}
	return sb.String()
}

// AnalyzeODTrip menganalisis perjalanan dari Titik A ke Titik B, mendeteksi bottleneck, keparahannya,
// merekomendasikan penambahan/pemindahan halte (bila perlu), dan menyusun narasi simulasi komuter As-Is vs To-Be.
func (s *AnalysisService) AnalyzeODTrip(ctx context.Context, origin, dest model.ODLocation, userID *string) (*model.ODTripAnalysisResult, error) {
	// 1. Jalankan kalkulasi spasial komprehensif di SpatialRepository
	result, err := s.spatialRepo.ComputeODTrip(ctx, origin, dest)
	if err != nil {
		return nil, fmt.Errorf("gagal komputasi spasial OD trip: %w", err)
	}

	// 2. Buat narasi AI menggunakan LLM jika tersedia
	var prompt string
	asIsStepsFormatted := formatJourneyStepsText(result.AsIsJourney.Steps)

	if result.ProposedStop.Action == "none" {
		prompt = fmt.Sprintf(`Kamu adalah LokaMaya Spatial AI. Berikan analisis perjalanan komuter perkotaan dari Titik A ke Titik B berikut:
Asal (Titik A): %s (Lat: %.4f, Lng: %.4f)
Tujuan (Titik B): %s (Lat: %.4f, Lng: %.4f)
Halte Terdekat Asal: %s (Jarak: %.0fm, ~%d menit jalan kaki)
Halte Terdekat Tujuan: %s (Jarak: %.0fm, ~%d menit jalan kaki)
Keparahan Bottleneck: %s (Skor Friksi: %d/100)
Status Rekomendasi Halte: TIDAK PERLU HALTE BARU (Layanan halte eksisting sudah optimal, first-mile & last-mile <= 480m)
Alasan: %s

Rincian Tahapan Perjalanan Komuter Eksisting (As-Is):
%s
Total Durasi Eksisting: ~%d menit (Jalan kaki %.0fm, Beban: %s, Transit: %d kali)

INSTRUKSI PENTING:
- Kedua titik sudah dekat dengan halte eksisting yang berada dalam jangkauan standar pedestrian perkotaan (<= 480m). TEGASKAN BAHWA TIDAK DIPERLUKAN PEMBANGUNAN HALTE BARU.
- Tampilkan rincian tahapan perjalanan di atas (Tahap 1 sampai selesai) secara jelas dan terstruktur.
- Format laporan:
1. 🚦 **Diagnosis & Tingkat Keparahan Bottleneck**
2. 🔍 **Rincian Akses Spasial (First-mile & Last-mile)**
3. 🚏 **Status Intervensi Halte** (Jelaskan halte eksisting sudah optimal dan tidak butuh halte baru)
4. ⏱️ **Rincian Tahapan Perjalanan Komuter (Eksisting)** (Jelaskan rute langkah demi langkah)
5. 💡 **Saran Kenyamanan Perjalanan** (Waktu tunggu, jam sibuk, atau tips transfer)`,
			result.Origin.Name, result.Origin.Latitude, result.Origin.Longitude,
			result.Destination.Name, result.Destination.Latitude, result.Destination.Longitude,
			result.NearestOriginStop.Name, result.Bottleneck.FirstMileGapMeters, result.NearestOriginStop.WalkMinutes,
			result.NearestDestinationStop.Name, result.Bottleneck.LastMileGapMeters, result.NearestDestinationStop.WalkMinutes,
			result.Bottleneck.Severity, result.Bottleneck.FrictionScore,
			result.ProposedStop.Rationale,
			asIsStepsFormatted,
			result.AsIsJourney.TotalDurationMinutes, result.AsIsJourney.TotalWalkDistanceMeters, result.AsIsJourney.PedestrianStrainLevel, result.AsIsJourney.TransitRidesCount,
		)
	} else {
		toBeStepsFormatted := formatJourneyStepsText(result.ToBeJourney.Steps)
		prompt = fmt.Sprintf(`Kamu adalah LokaMaya Spatial AI. Berikan analisis perjalanan komuter perkotaan dari Titik A ke Titik B berikut:
Asal (Titik A): %s (Lat: %.4f, Lng: %.4f)
Tujuan (Titik B): %s (Lat: %.4f, Lng: %.4f)
Halte Terdekat Asal: %s (Jarak: %.0fm, ~%d menit jalan kaki)
Halte Terdekat Tujuan: %s (Jarak: %.0fm, ~%d menit jalan kaki)
Keparahan Bottleneck: %s (Skor Friksi: %d/100)
Kendala Utama: %s
Rekomendasi Halte: %s (%s) pada (%.4f, %.4f) di Koridor %s. Rationale: %s

Rincian Tahapan Eksisting (As-Is):
%s
Perbandingan Pengalaman Komuter:
- As-Is: Total Durasi ~%d menit (Jalan kaki %.0fm, Beban: %s, Transit: %d kali)
- To-Be: Total Durasi ~%d menit (Jalan kaki %.0fm, Beban: %s, Transit: %d kali)
- Penghematan: Hemat ~%d menit perjalanan dan memotong jalan kaki sebesar %.0fm (Efisiensi +%d%%).

Rincian Tahapan Setelah Halte Baru (To-Be):
%s

Susun laporan narasi komprehensif, terstruktur, empati pada komuter harian, dengan format:
1. 🚦 **Diagnosis & Tingkat Keparahan Bottleneck**
2. 🔍 **Rincian Hambatan Spasial (First-mile, Last-mile, Transit)**
3. 🚏 **Rekomendasi Intervensi Halte (Wajib di Koridor Jalan Arteri/Kolektor)**
4. ⏱️ **Rincian Tahapan Perjalanan: As-Is vs To-Be** (Sajikan per tahap 1, 2, 3... Pada setiap tahapan naik bus/BRT, WAJIB sebutkan secara jelas nama rute bus yang dinaiki, halte keberangkatan, dan halte kedatangan/turunnya persis sesuai data rincian tahapan yang diberikan di atas)
5. 💡 **Rekomendasi Kebijakan & Langkah Lanjutan**`,
			result.Origin.Name, result.Origin.Latitude, result.Origin.Longitude,
			result.Destination.Name, result.Destination.Latitude, result.Destination.Longitude,
			result.NearestOriginStop.Name, result.Bottleneck.FirstMileGapMeters, result.NearestOriginStop.WalkMinutes,
			result.NearestDestinationStop.Name, result.Bottleneck.LastMileGapMeters, result.NearestDestinationStop.WalkMinutes,
			result.Bottleneck.Severity, result.Bottleneck.FrictionScore,
			strings.Join(result.Bottleneck.KeyIssues, "; "),
			result.ProposedStop.StopName, strings.ToUpper(result.ProposedStop.Action), result.ProposedStop.Latitude, result.ProposedStop.Longitude, result.ProposedStop.Corridor, result.ProposedStop.Rationale,
			asIsStepsFormatted,
			result.AsIsJourney.TotalDurationMinutes, result.AsIsJourney.TotalWalkDistanceMeters, result.AsIsJourney.PedestrianStrainLevel, result.AsIsJourney.TransitRidesCount,
			result.ToBeJourney.TotalDurationMinutes, result.ToBeJourney.TotalWalkDistanceMeters, result.ToBeJourney.PedestrianStrainLevel, result.ToBeJourney.TransitRidesCount,
			result.DeltaTravelTimeMinutes, result.DeltaWalkDistanceMeters, result.EfficiencyGainPercent,
			toBeStepsFormatted,
		)
	}

	messages := []client.ChatMessage{
		{Role: "system", Content: "Kamu adalah asisten ahli perencanaan transportasi publik perkotaan dan permodelan komuter Jakarta."},
		{Role: "user", Content: prompt},
	}

	aiText, err := s.litellm.Complete(ctx, client.DefaultModel, messages)
	if err != nil || aiText == "" {
		// Fallback narasi deterministik jika LLM offline
		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("### 🚦 Analisis Bottleneck Perjalanan: %s → %s\n\n", result.Origin.Name, result.Destination.Name))
		sb.WriteString(fmt.Sprintf("- **Tingkat Keparahan**: **%s** (Skor Friksi: **%d/100**)\n", result.Bottleneck.Severity, result.Bottleneck.FrictionScore))
		sb.WriteString(fmt.Sprintf("- **Diagnosis**: %s\n\n", result.Bottleneck.Summary))
		sb.WriteString("#### 🔍 Kendala Utama yang Dihadapi Komuter:\n")
		for _, issue := range result.Bottleneck.KeyIssues {
			sb.WriteString(fmt.Sprintf("- %s\n", issue))
		}

		if result.ProposedStop.Action == "none" {
			sb.WriteString("\n#### 🚏 Rekomendasi Halte Usulan:\n")
			sb.WriteString("- **Status**: ✅ **Layanan Halte Eksisting Sudah Optimal** (Tidak Perlu Halte Baru)\n")
			sb.WriteString(fmt.Sprintf("- **Keterangan**: %s\n\n", result.ProposedStop.Rationale))
			sb.WriteString("#### ⏱️ Rincian Tahapan Perjalanan Komuter (Eksisting):\n")
			sb.WriteString(asIsStepsFormatted)
			sb.WriteString(fmt.Sprintf("\n- **Total Durasi**: **~%d menit** | **Total Jalan Kaki**: **%.0fm** (Beban: *%s*)\n",
				result.AsIsJourney.TotalDurationMinutes, result.AsIsJourney.TotalWalkDistanceMeters, result.AsIsJourney.PedestrianStrainLevel))
		} else {
			corridorTag := result.ProposedStop.Corridor
			if !strings.HasPrefix(strings.ToLower(corridorTag), "koridor ") && !strings.HasPrefix(strings.ToLower(corridorTag), "feeder ") {
				corridorTag = "Koridor " + corridorTag
			}
			sb.WriteString(fmt.Sprintf("\n#### 🚏 Rekomendasi Halte Usulan:\n- **Usulan**: %s (**%s**)\n- **Koordinat**: `%.4f, %.4f` (%s)\n- **Dasar Rekomendasi**: %s\n\n",
				result.ProposedStop.StopName, strings.ToUpper(result.ProposedStop.Action),
				result.ProposedStop.Latitude, result.ProposedStop.Longitude,
				corridorTag, result.ProposedStop.Rationale))
			sb.WriteString("#### ⏱️ Rincian Tahapan Perjalanan (As-Is vs To-Be):\n")
			sb.WriteString("**Kondisi Eksisting (As-Is):**\n")
			sb.WriteString(asIsStepsFormatted)
			sb.WriteString(fmt.Sprintf("- Total waktu **~%d menit** dengan jalan kaki **%.0fm** (Beban: *%s*).\n\n",
				result.AsIsJourney.TotalDurationMinutes, result.AsIsJourney.TotalWalkDistanceMeters, result.AsIsJourney.PedestrianStrainLevel))

			toBeStepsFormatted := formatJourneyStepsText(result.ToBeJourney.Steps)
			sb.WriteString("**Setelah Halte Baru (To-Be):**\n")
			sb.WriteString(toBeStepsFormatted)
			sb.WriteString(fmt.Sprintf("- Total waktu **~%d menit** dengan jalan kaki **%.0fm** (Beban: *%s*).\n",
				result.ToBeJourney.TotalDurationMinutes, result.ToBeJourney.TotalWalkDistanceMeters, result.ToBeJourney.PedestrianStrainLevel))
			sb.WriteString(fmt.Sprintf("- **Dampak**: Hemat **%d menit** perjalanan & memangkas jalan kaki sebesar **%.0fm** (Efisiensi meningkat **+%d%%**).\n",
				result.DeltaTravelTimeMinutes, result.DeltaWalkDistanceMeters, result.EfficiencyGainPercent))
		}
		aiText = sb.String()
	}

	result.AINarrative = aiText
	return result, nil
}

