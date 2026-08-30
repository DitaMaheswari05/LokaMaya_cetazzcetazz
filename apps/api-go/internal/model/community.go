package model

// CommunityMap merepresentasikan satu entri Community Maps dari MAPID.
// TODO: sesuaikan field dengan schema tabel community_maps di database
type CommunityMap struct {
	ID          int64   `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Category    string  `json:"category"`         // hasil klasifikasi IndoBERT
	Confidence  float64 `json:"confidence"`       // confidence score dari IndoBERT
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	CreatedAt   string  `json:"created_at"`
}

// ClassifyRequest adalah request body untuk klasifikasi teks Community Maps.
// Dikirim dari Go ke Python ai-service.
type ClassifyRequest struct {
	Text   string   `json:"text"`
	Labels []string `json:"labels,omitempty"` // label kandidat; jika kosong, pakai default
}

// ClassifyResponse adalah respons dari Python ai-service untuk klasifikasi.
type ClassifyResponse struct {
	Label      string  `json:"label"`
	Confidence float64 `json:"confidence"`
}
