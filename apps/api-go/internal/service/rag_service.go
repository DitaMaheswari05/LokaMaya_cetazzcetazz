package service

// RAGService menangani pencarian semantik dokumen regulasi tata ruang.
// Flow: teks → embedding (ai-service BGE-M3) → pgvector similarity search → LiteLLM generate narasi
// TODO: implementasi dengan RegulationRepository, AIClient, LiteLLMClient
type RAGService struct {
	// regulationRepo *repository.RegulationRepository
	// aiClient       *client.AIClient
	// litellm        *client.LiteLLMClient
}

func NewRAGService() *RAGService {
	return &RAGService{}
}

// TODO: implementasi Search, GenerateNarrative, dll
