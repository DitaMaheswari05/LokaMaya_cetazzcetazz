package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// LiteLLMClient adalah HTTP client OpenAI-compatible ke LiteLLM proxy.
type LiteLLMClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewLiteLLMClient(baseURL, apiKey string) *LiteLLMClient {
	return &LiteLLMClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

// FunctionCall merepresentasikan detail pemanggilan fungsi.
type FunctionCall struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

// ToolCall merepresentasikan tool call dari OpenAI API.
type ToolCall struct {
	ID       string       `json:"id"`
	Type     string       `json:"type"`
	Function FunctionCall `json:"function"`
}

// ChatMessage merepresentasikan satu pesan dalam chat completion.
type ChatMessage struct {
	Role       string     `json:"role"` // "system", "user", "assistant", "tool"
	Content    string     `json:"content,omitempty"`
	Name       string     `json:"name,omitempty"`
	ToolCallID string     `json:"tool_call_id,omitempty"`
	ToolCalls  []ToolCall `json:"tool_calls,omitempty"`
}

// ToolDefinition mendefinisikan tool/function calling schema.
type ToolDefinition struct {
	Type     string             `json:"type"` // "function"
	Function FunctionDefinition `json:"function"`
}

type FunctionDefinition struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// ChatCompletionRequest adalah request body OpenAI-compatible untuk LiteLLM.
type ChatCompletionRequest struct {
	Model       string           `json:"model"`
	Messages    []ChatMessage    `json:"messages"`
	Tools       []ToolDefinition `json:"tools,omitempty"`
	ToolChoice  interface{}      `json:"tool_choice,omitempty"`
	Temperature float64          `json:"temperature,omitempty"`
	Stream      bool             `json:"stream,omitempty"`
}

// ChatCompletionResponse adalah respons dari LiteLLM (OpenAI-compatible).
type ChatCompletionResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Index        int         `json:"index"`
		Message      ChatMessage `json:"message"`
		FinishReason string      `json:"finish_reason"`
	} `json:"choices"`
}

// Complete mengirim request percakapan standar (text completion).
func (c *LiteLLMClient) Complete(ctx context.Context, model string, messages []ChatMessage) (string, error) {
	if model == "" {
		model = "gemini/gemini-1.5-flash"
	}

	req := ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		Temperature: 0.3,
	}

	var resp ChatCompletionResponse
	if err := c.postJSON(ctx, "/v1/chat/completions", req, &resp); err != nil {
		return "", fmt.Errorf("litellm complete error: %w", err)
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("tidak ada pilihan respons dari LiteLLM")
}

// ChatWithTools mengirim request percakapan dengan dukungan Tool Calling (Function Calling).
func (c *LiteLLMClient) ChatWithTools(ctx context.Context, model string, messages []ChatMessage, tools []ToolDefinition) (*ChatMessage, error) {
	if model == "" {
		model = "gemini/gemini-1.5-flash"
	}

	req := ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		Tools:       tools,
		ToolChoice:  "auto",
		Temperature: 0.2,
	}

	var resp ChatCompletionResponse
	if err := c.postJSON(ctx, "/v1/chat/completions", req, &resp); err != nil {
		return nil, fmt.Errorf("litellm tools error: %w", err)
	}

	if len(resp.Choices) > 0 {
		return &resp.Choices[0].Message, nil
	}

	return nil, fmt.Errorf("tidak ada respons dari LiteLLM")
}

// DefaultTools mengembalikan definisi tool PRD LokaMaya untuk Agentic Tool Calling.
func DefaultTools() []ToolDefinition {
	return []ToolDefinition{
		{
			Type: "function",
			Function: FunctionDefinition{
				Name:        "simulate_stop",
				Description: "Simulasikan penambahan, pemindahan, atau penutupan halte TransJakarta pada titik koordinat tertentu. Menghitung deterministik 3 skor: Akses Jalan Kaki, Ekonomi UMKM, dan Kelayakan Lokasi.",
				Parameters: map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"latitude": map[string]interface{}{
							"type":        "number",
							"description": "Latitude lokasi halte (-6.xxxx untuk Jakarta)",
						},
						"longitude": map[string]interface{}{
							"type":        "number",
							"description": "Longitude lokasi halte (106.xxxx untuk Jakarta)",
						},
						"scenario_type": map[string]interface{}{
							"type":        "string",
							"enum":        []string{"tambah", "pindah", "tutup"},
							"description": "Jenis skenario simulasi: tambah halte baru, pindah halte eksisting, atau tutup sementara",
						},
						"stop_name": map[string]interface{}{
							"type":        "string",
							"description": "Nama halte terkait",
						},
					},
					"required": []string{"latitude", "longitude", "scenario_type"},
				},
			},
		},
		{
			Type: "function",
			Function: FunctionDefinition{
				Name:        "query_area_insight",
				Description: "Ambil insight karakteristik area dan konteks kualitatif dari catatan survei lapangan (Survey Activities) pada titik koordinat tertentu.",
				Parameters: map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"latitude": map[string]interface{}{
							"type": "number",
						},
						"longitude": map[string]interface{}{
							"type": "number",
						},
					},
					"required": []string{"latitude", "longitude"},
				},
			},
		},
		{
			Type: "function",
			Function: FunctionDefinition{
				Name:        "explain_score",
				Description: "Jelaskan rincian dan komponen metodologi penilaian skor LokaMaya.",
				Parameters: map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"score_type": map[string]interface{}{
							"type": "string",
							"enum": []string{"akses_jalan_kaki", "ekonomi_umkm", "kelayakan_lokasi", "konektivitas_rute"},
						},
					},
					"required": []string{"score_type"},
				},
			},
		},
	}
}

// postJSON adalah helper HTTP POST ke LiteLLM dengan API key authentication.
func (c *LiteLLMClient) postJSON(ctx context.Context, path string, reqBody, respBody interface{}) error {
	b, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("litellm request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errBuf bytes.Buffer
		_, _ = errBuf.ReadFrom(resp.Body)
		return fmt.Errorf("litellm error status %d: %s", resp.StatusCode, errBuf.String())
	}

	return json.NewDecoder(resp.Body).Decode(respBody)
}
