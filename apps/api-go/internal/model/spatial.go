package model

// GeoJSONGeometry merepresentasikan geometry GeoJSON standar.
type GeoJSONGeometry struct {
	Type        string      `json:"type"`
	Coordinates interface{} `json:"coordinates"`
}

// GeoJSONFeature merepresentasikan satu fitur GeoJSON dengan properties.
type GeoJSONFeature struct {
	Type       string                 `json:"type"`
	ID         interface{}            `json:"id,omitempty"`
	Geometry   GeoJSONGeometry        `json:"geometry"`
	Properties map[string]interface{} `json:"properties"`
}

// GeoJSONFeatureCollection merepresentasikan kumpulan fitur GeoJSON.
type GeoJSONFeatureCollection struct {
	Type     string           `json:"type"`
	Features []GeoJSONFeature `json:"features"`
}

// BoundingBox merepresentasikan bounding box [minLng, minLat, maxLng, maxLat].
type BoundingBox [4]float64

// SpatialAnalysisRequest adalah request body untuk endpoint analisis spasial.
// TODO: sesuaikan field dengan kebutuhan analisis (buffer, intersect, dll)
type SpatialAnalysisRequest struct {
	Geometry GeoJSONGeometry `json:"geometry"`
	Buffer   float64         `json:"buffer_meters,omitempty"`
}

// SpatialAnalysisResult adalah hasil analisis spasial.
// TODO: tambahkan field hasil analisis (area, jumlah fasilitas, dll)
type SpatialAnalysisResult struct {
	FeatureCollection GeoJSONFeatureCollection `json:"feature_collection"`
	Metadata          map[string]interface{}   `json:"metadata,omitempty"`
}
