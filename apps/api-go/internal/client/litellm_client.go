package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// LiteLLMClient adalah HTTP client OpenAI-compatible ke LiteLLM proxy dengan direct fallback ke Google AI Studio.
type LiteLLMClient struct {
	baseURL    string
	apiKey     string
	geminiKey  string
	httpClient *http.Client
}

func NewLiteLLMClient(baseURL, apiKey, geminiKey string) *LiteLLMClient {
	return &LiteLLMClient{
		baseURL:   baseURL,
		apiKey:    apiKey,
		geminiKey: geminiKey,
		httpClient: &http.Client{
			Timeout: 12 * time.Second,
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

// EmbedRequest adalah request body untuk endpoint /v1/embeddings.
type EmbedRequest struct {
	Model string   `json:"model"`
	Input []string `json:"input"`
}

// EmbedResponse adalah respons dari endpoint /v1/embeddings.
type EmbedResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
	} `json:"data"`
}

// DefaultModel adalah model Gemini default aktif
const DefaultModel = "gemini-flash-lite-latest"

// Complete mengirim request percakapan standar (text completion).
func (c *LiteLLMClient) Complete(ctx context.Context, model string, messages []ChatMessage) (string, error) {
	if model == "" || model == "gemini/gemini-1.5-flash" || model == "gemini-1.5-flash" {
		model = DefaultModel
	}

	req := ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		Temperature: 0.3,
	}

	var resp ChatCompletionResponse
	err := c.postJSON(ctx, "/v1/chat/completions", req, &resp)
	if err == nil && len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}

	// Direct fallback ke Google AI Studio jika LiteLLM offline atau error
	if c.geminiKey != "" {
		if direct, dirErr := c.callGeminiDirect(ctx, messages); dirErr == nil && direct != "" {
			return direct, nil
		}
	}

	if err != nil {
		return "", fmt.Errorf("litellm complete error: %w", err)
	}
	return "", fmt.Errorf("tidak ada pilihan respons dari LiteLLM")
}

// ChatWithTools mengirim request percakapan dengan dukungan Tool Calling (Function Calling).
func (c *LiteLLMClient) ChatWithTools(ctx context.Context, model string, messages []ChatMessage, tools []ToolDefinition) (*ChatMessage, error) {
	if model == "" || model == "gemini/gemini-1.5-flash" || model == "gemini-1.5-flash" {
		model = DefaultModel
	}

	req := ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		Tools:       tools,
		ToolChoice:  "auto",
		Temperature: 0.2,
	}

	var resp ChatCompletionResponse
	err := c.postJSON(ctx, "/v1/chat/completions", req, &resp)
	if err == nil && len(resp.Choices) > 0 {
		return &resp.Choices[0].Message, nil
	}

	// Direct fallback ke Google AI Studio jika LiteLLM offline atau error
	if c.geminiKey != "" {
		if direct, dirErr := c.callGeminiDirect(ctx, messages); dirErr == nil && direct != "" {
			return &ChatMessage{
				Role:    "assistant",
				Content: direct,
			}, nil
		}
	}

	if err != nil {
		return nil, fmt.Errorf("litellm tools error: %w", err)
	}
	return nil, fmt.Errorf("tidak ada respons dari LiteLLM")
}

// Embed mengirim request ke endpoint /v1/embeddings.
func (c *LiteLLMClient) Embed(ctx context.Context, model string, input []string) ([][]float32, error) {
	if model == "" {
		model = "text-embedding-004"
	}
	req := EmbedRequest{
		Model: model,
		Input: input,
	}

	var resp EmbedResponse
	err := c.postJSON(ctx, "/v1/embeddings", req, &resp)
	if err == nil && len(resp.Data) > 0 {
		var embeddings [][]float32
		for _, d := range resp.Data {
			embeddings = append(embeddings, d.Embedding)
		}
		return embeddings, nil
	}

	// Direct fallback
	if c.geminiKey != "" {
		if direct, dirErr := c.callGeminiEmbedDirect(ctx, model, input); dirErr == nil && len(direct) > 0 {
			return direct, nil
		}
	}

	if err != nil {
		return nil, fmt.Errorf("litellm embed error: %w", err)
	}
	return nil, fmt.Errorf("tidak ada response embedding dari LiteLLM")
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
		{
			Type: "function",
			Function: FunctionDefinition{
				Name:        "deliberate_stakeholders",
				Description: "Jalankan simulasi musyawarah AI Urban Council (Warga Rina, Pelaku UMKM Siti, Staf Dishub Andi) untuk mengukur tingkat konsensus sosial dan solusi kompromi penataan halte.",
				Parameters: map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"latitude": map[string]interface{}{
							"type":        "number",
							"description": "Latitude lokasi halte",
						},
						"longitude": map[string]interface{}{
							"type":        "number",
							"description": "Longitude lokasi halte",
						},
						"scenario_type": map[string]interface{}{
							"type":        "string",
							"enum":        []string{"tambah", "pindah", "tutup"},
							"description": "Jenis skenario perubahan",
						},
						"stop_name": map[string]interface{}{
							"type": "string",
						},
					},
					"required": []string{"latitude", "longitude", "scenario_type"},
				},
			},
		},
		{
			Type: "function",
			Function: FunctionDefinition{
				Name:        "find_optimal_stops",
				Description: "Cari secara otonom 3 titik halte Pareto-optimal terbaik di sepanjang koridor jalan tertentu (Pilihan Warga, Pilihan UMKM, dan Pilihan Resilien Bebas Banjir).",
				Parameters: map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"corridor_name": map[string]interface{}{
							"type":        "string",
							"description": "Nama koridor jalan (misal: Jl. Gatot Subroto, Jl. Sudirman, Jl. Daan Mogot)",
						},
						"center_latitude": map[string]interface{}{
							"type": "number",
						},
						"center_longitude": map[string]interface{}{
							"type": "number",
						},
					},
					"required": []string{"corridor_name"},
				},
			},
		},
		{
			Type: "function",
			Function: FunctionDefinition{
				Name:        "generate_policy_brief",
				Description: "Susun draf naskah advokasi kebijakan formal (Policy Brief) berisi dasar hukum RDTR, matriks skor spasial, hasil musyawarah, dan rekomendasi mitigasi rekayasa siap serah ke Pemprov/Dishub.",
				Parameters: map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"latitude": map[string]interface{}{
							"type": "number",
						},
						"longitude": map[string]interface{}{
							"type": "number",
						},
						"stop_name": map[string]interface{}{
							"type": "string",
						},
						"scenario_type": map[string]interface{}{
							"type": "string",
						},
					},
					"required": []string{"latitude", "longitude", "scenario_type"},
				},
			},
		},
		{
			Type: "function",
			Function: FunctionDefinition{
				Name:        "analyze_od_trip",
				Description: "Analisis perjalanan komuter dari Titik Asal (A) ke Titik Tujuan (B), mendeteksi bottleneck dan tingkat keparahannya, rekomendasi pembuatan atau pemindahan halte, serta simulasi komparasi pengalaman komuter To-Be vs As-Is.",
				Parameters: map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"origin_lat": map[string]interface{}{
							"type":        "number",
							"description": "Latitude titik asal (Titik A)",
						},
						"origin_lng": map[string]interface{}{
							"type":        "number",
							"description": "Longitude titik asal (Titik A)",
						},
						"origin_name": map[string]interface{}{
							"type":        "string",
							"description": "Nama lokasi atau kawasan asal (Titik A)",
						},
						"dest_lat": map[string]interface{}{
							"type":        "number",
							"description": "Latitude titik tujuan (Titik B)",
						},
						"dest_lng": map[string]interface{}{
							"type":        "number",
							"description": "Longitude titik tujuan (Titik B)",
						},
						"dest_name": map[string]interface{}{
							"type":        "string",
							"description": "Nama lokasi atau kawasan tujuan (Titik B)",
						},
					},
					"required": []string{"origin_lat", "origin_lng", "dest_lat", "dest_lng"},
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

// ─── Direct Google AI Studio Gemini API Fallback ─────────────────────────────

type geminiPart struct {
	Text string `json:"text"`
}

type geminiContentItem struct {
	Role  string       `json:"role,omitempty"`
	Parts []geminiPart `json:"parts"`
}

type geminiDirectReq struct {
	Contents          []geminiContentItem `json:"contents"`
	SystemInstruction *geminiContentItem  `json:"systemInstruction,omitempty"`
}

type geminiDirectResp struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (c *LiteLLMClient) callGeminiDirect(ctx context.Context, messages []ChatMessage) (string, error) {
	if c.geminiKey == "" {
		return "", fmt.Errorf("gemini API key is empty")
	}

	var contents []geminiContentItem
	var sysInstruction *geminiContentItem

	for _, msg := range messages {
		if msg.Role == "system" {
			sysInstruction = &geminiContentItem{
				Parts: []geminiPart{{Text: msg.Content}},
			}
		} else {
			role := "user"
			if msg.Role == "assistant" {
				role = "model"
			}
			if msg.Content != "" {
				contents = append(contents, geminiContentItem{
					Role:  role,
					Parts: []geminiPart{{Text: msg.Content}},
				})
			}
		}
	}

	if len(contents) == 0 {
		return "", fmt.Errorf("no user/model messages to send")
	}

	body := geminiDirectReq{
		Contents:          contents,
		SystemInstruction: sysInstruction,
	}

	b, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=%s", c.geminiKey)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	httpResp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		var errBuf bytes.Buffer
		_, _ = errBuf.ReadFrom(httpResp.Body)
		return "", fmt.Errorf("gemini api error status %d: %s", httpResp.StatusCode, errBuf.String())
	}

	var gResp geminiDirectResp
	if err := json.NewDecoder(httpResp.Body).Decode(&gResp); err != nil {
		return "", err
	}

	if len(gResp.Candidates) > 0 && len(gResp.Candidates[0].Content.Parts) > 0 {
		return gResp.Candidates[0].Content.Parts[0].Text, nil
	}

	return "", fmt.Errorf("empty candidates from gemini direct")
}

// ─── Direct Google AI Studio Gemini API Embedding Fallback ───────────────

type geminiEmbedReq struct {
	Content geminiContentItem `json:"content"`
}

type geminiBatchEmbedReq struct {
	Requests []geminiEmbedReq `json:"requests"`
}

type geminiEmbedResp struct {
	Embeddings []struct {
		Values []float32 `json:"values"`
	} `json:"embeddings"`
}

func (c *LiteLLMClient) callGeminiEmbedDirect(ctx context.Context, model string, texts []string) ([][]float32, error) {
	if c.geminiKey == "" {
		return nil, fmt.Errorf("gemini API key is empty")
	}

	var requests []geminiEmbedReq
	for _, text := range texts {
		requests = append(requests, geminiEmbedReq{
			Content: geminiContentItem{
				Parts: []geminiPart{{Text: text}},
			},
		})
	}

	body := geminiBatchEmbedReq{Requests: requests}
	b, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:batchEmbedContents?key=%s", model, c.geminiKey)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	httpResp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		var errBuf bytes.Buffer
		_, _ = errBuf.ReadFrom(httpResp.Body)
		return nil, fmt.Errorf("gemini embed error status %d: %s", httpResp.StatusCode, errBuf.String())
	}

	var gResp geminiEmbedResp
	if err := json.NewDecoder(httpResp.Body).Decode(&gResp); err != nil {
		return nil, err
	}

	var embeddings [][]float32
	for _, e := range gResp.Embeddings {
		embeddings = append(embeddings, e.Values)
	}
	return embeddings, nil
}
