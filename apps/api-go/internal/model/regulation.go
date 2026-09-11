package model

// RegulationDocument merepresentasikan satu dokumen regulasi tata ruang
// yang disimpan di PostgreSQL beserta vector embedding-nya (pgvector).
// TODO: sesuaikan field dengan schema tabel regulations di database
type RegulationDocument struct {
	ID         int64   `json:"id"`
	Title      string  `json:"title"`
	Category   string  `json:"category,omitempty"`
	Section    string  `json:"section,omitempty"`
	Content    string  `json:"content"`
	Source     string  `json:"source"`
	Region     string  `json:"region"`
	CreatedAt  string  `json:"created_at"`
	Similarity float64 `json:"similarity,omitempty"`
}

// RAGSearchRequest adalah request body untuk pencarian semantik dokumen regulasi.
type RAGSearchRequest struct {
	Query       string `json:"query"`
	TopK        int    `json:"top_k,omitempty"`         // jumlah dokumen yang dikembalikan (default: 5)
	Region      string `json:"region,omitempty"`        // filter per wilayah
	GenerateAI  bool   `json:"generate_ai,omitempty"`   // jika true, generate narasi via LiteLLM
}

// RAGSearchResult adalah respons pencarian semantik dokumen regulasi.
type RAGSearchResult struct {
	Documents   []RegulationDocument `json:"documents"`
	AIResponse  string               `json:"ai_response,omitempty"` // narasi AI (jika GenerateAI=true)
}
