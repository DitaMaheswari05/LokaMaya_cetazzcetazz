package model

// SimulateRequest adalah body request untuk menjalankan simulasi perubahan halte.
type SimulateRequest struct {
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	ScenarioType string  `json:"scenario_type"` // "tambah", "pindah", "tutup"
	StopName     string  `json:"stop_name,omitempty"`
	TargetStopID string  `json:"target_stop_id,omitempty"`
}

// WalkScoreDetail adalah detail komponen skor akses jalan kaki.
type WalkScoreDetail struct {
	Score               int             `json:"score"`    // 0-100
	Category            string          `json:"category"` // "baik", "sedang", "perlu_perhatian"
	EstimatedReach5Min  int             `json:"estimated_reach_5min"`
	EstimatedReach10Min int             `json:"estimated_reach_10min"`
	IsochroneGeometry   *GeoJSONFeature `json:"isochrone_geometry,omitempty"`
}

// UMKMScoreDetail adalah detail komponen skor aktivitas ekonomi UMKM.
type UMKMScoreDetail struct {
	Score               int    `json:"score"`    // 0-100
	Category            string `json:"category"` // "baik", "sedang", "perlu_perhatian"
	StrukGoTransactions int    `json:"struk_go_transactions"`
	InformalVendorCount int    `json:"informal_vendor_count"`
	FormalBusinessCount int    `json:"formal_business_count"`
}

// FeasibilityDetail adalah status kesesuaian tata ruang dan risiko banjir.
type FeasibilityDetail struct {
	Status         string `json:"status"`     // "Sesuai", "Bersyarat", "Tidak Sesuai"
	ZoneCode       string `json:"zone_code"`  // kode RDTR
	ZoneName       string `json:"zone_name"`  // peruntukan lahan
	FloodRisk      string `json:"flood_risk"` // "Rendah", "Sedang", "Tinggi"
	Recommendation string `json:"recommendation"`
}

// RouteConnectivityDetail adalah dampak pada rute TransJakarta.
type RouteConnectivityDetail struct {
	ConnectedRoutes []string `json:"connected_routes"`
	DisruptedRoutes []string `json:"disrupted_routes"`
	TotalAffected   int      `json:"total_affected"`
}

// RouteStopItem merepresentasikan satu halte dalam urutan rute BRT TransJakarta.
type RouteStopItem struct {
	Sequence    int     `json:"sequence"`
	Name        string  `json:"name"`
	Status      string  `json:"status"` // "existing", "added", "removed", "relocated"
	IsSimulated bool    `json:"is_simulated"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
}

// RouteComparisonDetail menyimpan geometri, urutan halte riil (Halte A -> Halte B -> Halte C), dan metrik perbandingan rute As-Is vs To-Be.
type RouteComparisonDetail struct {
	PrimaryRouteCode       string                 `json:"primary_route_code"`        // misal "3F"
	PrimaryRouteName       string                 `json:"primary_route_name"`        // misal "Kalideres - Gelora Bung Karno"
	AffectedCorridor       string                 `json:"affected_corridor"`         // misal "Koridor 3F (Kalideres - Gelora Bung Karno)"
	Direction              string                 `json:"direction"`                 // misal "Kalideres - Gelora Bung Karno"
	AsIsStops              []RouteStopItem        `json:"as_is_stops"`               // Urutan halte As-Is lengkap
	ToBeStops              []RouteStopItem        `json:"to_be_stops"`               // Urutan halte To-Be dengan status penambahan/penutupan
	ChangedSegment         string                 `json:"changed_segment"`           // misal "Pulo Nangka → [Halte Baru] → Jembatan Gantung"
	AllAffectedRoutes      []string               `json:"all_affected_routes"`       // Daftar rute terdekat yang terdampak, misal ["3F", "3", "2A"]
	DeltaDistanceMeters    float64                `json:"delta_distance_meters"`
	DeltaTravelTimeMinutes float64                `json:"delta_travel_time_minutes"`
	Summary                string                 `json:"summary"`
	AsIsGeoJSON            map[string]interface{} `json:"as_is_geojson"`
	ToBeGeoJSON            map[string]interface{} `json:"to_be_geojson"`
}

// QualitativeContext menyimpan konteks lapangan hasil Survey Activities.
type QualitativeContext struct {
	HasSurveyData      bool   `json:"has_survey_data"`
	NearestSurveyPoint string `json:"nearest_survey_point,omitempty"`
	DistanceMeters     int    `json:"distance_meters,omitempty"`
	FieldNotes         string `json:"field_notes,omitempty"`
	PainPoints         string `json:"pain_points,omitempty"`
	Potentials         string `json:"potentials,omitempty"`
}

// BehavioralRippleDetail adalah proyeksi efek domino perilaku pejalan kaki dan ekonomi informal.
type BehavioralRippleDetail struct {
	ModalShiftOjolPercent  int    `json:"modal_shift_ojol_percent"` // Estimasi pergeseran ke ojol (%)
	WalkCommuterImpact     string `json:"walk_commuter_impact"`     // Dampak pada pejalan kaki
	InformalVendorTurnover string `json:"informal_vendor_turnover"` // Dampak omset pedagang kecil
	Summary                string `json:"summary"`
}

// SimulationResult adalah hasil kalkulasi deterministik + narasi AI untuk satu skenario.
type SimulationResult struct {
	ID                 string                  `json:"id"`
	ScenarioType       string                  `json:"scenario_type"`
	StopName           string                  `json:"stop_name"`
	Latitude           float64                 `json:"latitude"`
	Longitude          float64                 `json:"longitude"`
	WalkAccessibility  WalkScoreDetail         `json:"walk_accessibility"`
	UMKMEconomic       UMKMScoreDetail         `json:"umkm_economic"`
	SiteFeasibility    FeasibilityDetail       `json:"site_feasibility"`
	RouteConnectivity  RouteConnectivityDetail `json:"route_connectivity"`
	RouteComparison    *RouteComparisonDetail  `json:"route_comparison,omitempty"`
	Deliberation       *DeliberationResult     `json:"deliberation,omitempty"`
	BehavioralRipple   *BehavioralRippleDetail `json:"behavioral_ripple,omitempty"`
	PolicyBrief        string                  `json:"policy_brief,omitempty"`
	QualitativeContext QualitativeContext      `json:"qualitative_context"`
	AINarrative        string                  `json:"ai_narrative"`
	CreatedAt          string                  `json:"created_at"`
}

// CompareRequest untuk membandingkan dua skenario side-by-side.
type CompareRequest struct {
	ScenarioA SimulateRequest `json:"scenario_a"`
	ScenarioB SimulateRequest `json:"scenario_b"`
}

// CompareResult adalah respons perbandingan dua skenario dengan narasi komparatif.
type CompareResult struct {
	ScenarioA           SimulationResult `json:"scenario_a"`
	ScenarioB           SimulationResult `json:"scenario_b"`
	ComparativeNarrative string          `json:"comparative_narrative"`
	RecommendedScenario  string          `json:"recommended_scenario"` // "scenario_a" atau "scenario_b"
}

// StakeholderOpinion merepresentasikan pendapat satu persona dalam AI Urban Council.
type StakeholderOpinion struct {
	Persona   string `json:"persona"`    // "Rina (Warga)", "Siti (UMKM)", "Andi (Dishub)"
	Role      string `json:"role"`       // "Komuter Harian", "Pelaku Usaha Mikro", "Perencana Transportasi"
	Stance    string `json:"stance"`     // "Mendukung", "Netral", "Keberatan", "Mendukung Bersyarat"
	Quote     string `json:"quote"`      // Kalimat langsung sentimen persona
	KeyReason string `json:"key_reason"` // Poin inti pertimbangan
}

// DeliberationResult adalah hasil musyawarah multi-agent virtual.
type DeliberationResult struct {
	SimulationID         string               `json:"simulation_id"`
	SocialAcceptanceRate int                  `json:"social_acceptance_rate"` // 0-100%
	ConsensusLevel       string               `json:"consensus_level"`       // "Tinggi", "Sedang", "Rendah"
	Stakeholders         []StakeholderOpinion `json:"stakeholders"`
	CompromiseSolution   string               `json:"compromise_solution"`
}

// OptimalStopCandidate merepresentasikan titik rekomendasi hasil eksplorasi otonom.
type OptimalStopCandidate struct {
	Rank             int              `json:"rank"`
	Title            string           `json:"title"` // "Pilihan Warga", "Pilihan UMKM", "Pilihan Resilien"
	Latitude         float64          `json:"latitude"`
	Longitude        float64          `json:"longitude"`
	SimulationResult SimulationResult `json:"simulation_result"`
	Reason           string           `json:"reason"`
}

// OptimalSearchResponse adalah respons pencarian koridor otonom.
type OptimalSearchResponse struct {
	CorridorName  string                 `json:"corridor_name"`
	TotalSampled  int                    `json:"total_sampled"`
	TopCandidates []OptimalStopCandidate `json:"top_candidates"`
}

