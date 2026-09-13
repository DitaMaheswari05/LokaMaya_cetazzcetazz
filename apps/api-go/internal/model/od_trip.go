package model

// ODLocation merepresentasikan titik asal atau tujuan dalam analisis perjalanan.
type ODLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Name      string  `json:"name,omitempty"`
}

// ODStopReference merepresentasikan halte eksisting terdekat dari titik komuter.
type ODStopReference struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	DistanceMeters float64  `json:"distance_meters"`
	WalkMinutes    int      `json:"walk_minutes"`
	Corridor       string   `json:"corridor"`
	Routes         []string `json:"routes"`
	Latitude       float64  `json:"latitude"`
	Longitude      float64  `json:"longitude"`
	IsBRT          bool     `json:"is_brt"`
}

// BottleneckDetail mendeskripsikan kendala/hambatan transit yang dihadapi komuter.
type BottleneckDetail struct {
	Severity            string   `json:"severity"`              // "Kritis" | "Sedang" | "Ringan"
	FrictionScore       int      `json:"friction_score"`        // 0 - 100 (makin tinggi makin parah)
	FirstMileGapMeters  float64  `json:"first_mile_gap_meters"` // Jarak dari Titik A ke halte terdekat
	LastMileGapMeters   float64  `json:"last_mile_gap_meters"`  // Jarak dari halte akhir ke Titik B
	RequiresTransfer    bool     `json:"requires_transfer"`     // Apakah harus pindah koridor
	TransferCount       int      `json:"transfer_count"`        // Jumlah transit yang dibutuhkan
	FloodRiskDetected   bool     `json:"flood_risk_detected"`   // Jalur melewati area rawan genangan air
	Summary             string   `json:"summary"`               // Ringkasan diagnosis bottleneck
	KeyIssues           []string `json:"key_issues"`            // Poin-poin spesifik kendala
	PublicInterestNote  string   `json:"public_interest_note,omitempty"` // Penjelasan penempatan halte eksisting untuk melayani mayoritas publik
}

// ProposedStopRecommendation berisi usulan halte baru, relokasi halte, atau optimalisasi halte eksisting untuk mengatasi bottleneck.
type ProposedStopRecommendation struct {
	Action                      string  `json:"action"` // "tambah" | "pindah" | "none"
	StopName                    string  `json:"stop_name"`
	Latitude                    float64 `json:"latitude"`
	Longitude                   float64 `json:"longitude"`
	Corridor                    string  `json:"corridor"`
	DistanceToOriginMeters      float64 `json:"distance_to_origin_meters"`
	DistanceToDestinationMeters float64 `json:"distance_to_destination_meters"`
	Rationale                   string  `json:"rationale"`
	EstimatedReachPopulation    int     `json:"estimated_reach_population"`
	PublicInterestContext       string  `json:"public_interest_context,omitempty"`        // Konteks utilitas mayoritas komuter
	NearestExistingStopName     string  `json:"nearest_existing_stop_name,omitempty"`      // Nama halte eksisting terdekat
	DistanceToNearestStopMeters float64 `json:"distance_to_nearest_stop_meters,omitempty"` // Jarak ke halte eksisting terdekat
	WalkSavingsMeters           float64 `json:"walk_savings_meters,omitempty"`            // Estimasi pemotongan jarak jalan kaki
	MitigationStrategy          string  `json:"mitigation_strategy,omitempty"`             // "feeder_microtrans" | "pedestrian_improvement" | "relocation" | "new_stop"
}

// JourneyStep adalah satu segmen langkah perjalanan dalam simulasi komuter.
type JourneyStep struct {
	StepNumber      int     `json:"step_number"`
	Mode            string  `json:"mode"` // "walk" | "bus" | "transfer"
	Title           string  `json:"title"`
	Description     string  `json:"description"`
	DistanceMeters  float64 `json:"distance_meters"`
	DurationMinutes int     `json:"duration_minutes"`
	Icon            string  `json:"icon,omitempty"`
}

// JourneySimulation merangkum seluruh pengalaman komuter untuk satu skenario (As-Is atau To-Be).
type JourneySimulation struct {
	TotalDurationMinutes    int           `json:"total_duration_minutes"`
	TotalWalkDistanceMeters float64       `json:"total_walk_distance_meters"`
	TotalTransitTimeMinutes int           `json:"total_transit_time_minutes"`
	TransitRidesCount       int           `json:"transit_rides_count"`
	PedestrianStrainLevel   string        `json:"pedestrian_strain_level"` // "Sangat Berat" | "Sedang" | "Nyaman"
	ComfortRating           int           `json:"comfort_rating"`          // 1 - 100
	Steps                   []JourneyStep `json:"steps"`
}

// ODTripAnalysisResult adalah hasil komprehensif analisis OD Trip.
type ODTripAnalysisResult struct {
	Origin                  ODLocation                 `json:"origin"`
	Destination             ODLocation                 `json:"destination"`
	DirectDistanceMeters    float64                    `json:"direct_distance_meters"`
	NearestOriginStop       ODStopReference            `json:"nearest_origin_stop"`
	NearestDestinationStop  ODStopReference            `json:"nearest_destination_stop"`
	Bottleneck              BottleneckDetail           `json:"bottleneck"`
	ProposedStop            ProposedStopRecommendation `json:"proposed_stop"`
	AsIsJourney             JourneySimulation          `json:"as_is_journey"`
	ToBeJourney             JourneySimulation          `json:"to_be_journey"`
	DeltaTravelTimeMinutes  int                        `json:"delta_travel_time_minutes"`  // Positif = waktu dihemat
	DeltaWalkDistanceMeters float64                    `json:"delta_walk_distance_meters"` // Positif = jarak dipotong
	EfficiencyGainPercent   int                        `json:"efficiency_gain_percent"`
	AINarrative             string                     `json:"ai_narrative"`
	RouteGeoJSON            map[string]interface{}     `json:"route_geojson,omitempty"`
}

// ODTripRequest adalah payload HTTP request untuk endpoint OD trip.
type ODTripRequest struct {
	Origin      ODLocation `json:"origin"`
	Destination ODLocation `json:"destination"`
}
