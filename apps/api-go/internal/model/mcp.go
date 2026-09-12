package model

// NearbyStopItem merepresentasikan ringkasan satu halte terdekat.
type NearbyStopItem struct {
	StopID            string   `json:"stop_id"`
	StopName          string   `json:"stop_name"`
	IsBRT             bool     `json:"is_brt"`
	StopType          string   `json:"stop_type"` // "BRT_BARRIER" atau "NON_BRT_FEEDER"
	Corridor          string   `json:"corridor"`
	DistanceMeters    float64  `json:"distance_meters"`
	WalkTimeMinutes   int      `json:"walk_time_minutes"`
	Latitude          float64  `json:"latitude"`
	Longitude         float64  `json:"longitude"`
	ActiveRoutesCount int      `json:"active_routes_count"`
	Routes            []string `json:"routes,omitempty"`
}

// NearbyStopsResult merepresentasikan hasil query get_nearby_stops.
type NearbyStopsResult struct {
	QueryLatitude  float64          `json:"query_latitude"`
	QueryLongitude float64          `json:"query_longitude"`
	TotalFound     int              `json:"total_found"`
	Stops          []NearbyStopItem `json:"stops"`
}

// StopRouteInfo merepresentasikan rute bus/feeder yang melayani halte.
type StopRouteInfo struct {
	RouteCode   string `json:"route_code"`
	RouteName   string `json:"route_name"`
	ServiceType string `json:"service_type"`
	Direction   string `json:"direction,omitempty"`
}

// StopSpatialContext merepresentasikan konteks tata ruang dan risiko lingkungan sekitar halte.
type StopSpatialContext struct {
	RDTRZoneCode            string `json:"rdtr_zone_code"`
	RDTRZoneName            string `json:"rdtr_zone_name"`
	FloodHazardLevel        string `json:"flood_hazard_level"`
	CatchmentPopulation5Min int    `json:"catchment_population_5min"`
}

// StopDetailResult merepresentasikan detail komprehensif halte untuk MCP get_stop_details.
type StopDetailResult struct {
	StopID                string             `json:"stop_id"`
	StopName              string             `json:"stop_name"`
	Corridor              string             `json:"corridor"`
	StopType              string             `json:"stop_type"` // "BRT_BARRIER" atau "NON_BRT_FEEDER"
	IsBRT                 bool               `json:"is_brt"`
	Latitude              float64            `json:"latitude"`
	Longitude             float64            `json:"longitude"`
	Routes                []StopRouteInfo    `json:"routes"`
	IntermodalConnections []string           `json:"intermodal_connections"`
	SpatialContext        StopSpatialContext `json:"spatial_context"`
}
