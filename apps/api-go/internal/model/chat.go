package model

// ContextLocation merepresentasikan titik yang ditambahkan ke Context Chip chat.
type ContextLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	StopName  string  `json:"stop_name,omitempty"`
}

// ChatMessageItem adalah satu pertukaran pesan dalam sesi chat.
type ChatMessageItem struct {
	Role    string `json:"role"` // "user", "assistant", "system"
	Content string `json:"content"`
}

// ChatRequest adalah request body dari frontend untuk AI Chatbot.
type ChatRequest struct {
	Message         string            `json:"message"`
	ContextLocation *ContextLocation  `json:"context_location,omitempty"`
	History         []ChatMessageItem `json:"history,omitempty"`
}

// ChatResponse adalah respons dari AI Chatbot ke pengguna.
type ChatResponse struct {
	Message             string            `json:"message"`
	TriggeredSimulation *SimulationResult `json:"triggered_simulation,omitempty"`
	ToolExecuted        string            `json:"tool_executed,omitempty"`
	SuggestedQuestions  []string          `json:"suggested_questions,omitempty"`
}
