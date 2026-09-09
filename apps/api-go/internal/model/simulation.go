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

// QualitativeContext menyimpan konteks lapangan hasil Survey Activities.
type QualitativeContext struct {
	HasSurveyData      bool   `json:"has_survey_data"`
	NearestSurveyPoint string `json:"nearest_survey_point,omitempty"`
	DistanceMeters     int    `json:"distance_meters,omitempty"`
	FieldNotes         string `json:"field_notes,omitempty"`
	PainPoints         string `json:"pain_points,omitempty"`
	Potentials         string `json:"potentials,omitempty"`
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
