package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// AIClient adalah HTTP client untuk berkomunikasi dengan Python ai-service.
// ai-service expose dua endpoint: /embed (BGE-M3) dan /classify (IndoBERT).
type AIClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewAIClient(baseURL string) *AIClient {
	return &AIClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 60 * time.Second, // model inference bisa butuh waktu
		},
	}
}

// EmbedRequest adalah request body ke POST /embed di ai-service.
type EmbedRequest struct {
	Texts []string `json:"texts"`
}

// EmbedResponse adalah respons dari POST /embed.
type EmbedResponse struct {
	Embeddings [][]float32 `json:"embeddings"`
}

// ClassifyRequest adalah request body ke POST /classify di ai-service.
type ClassifyRequest struct {
	Text   string   `json:"text"`
	Labels []string `json:"labels,omitempty"`
}

// ClassifyResponse adalah respons dari POST /classify.
type ClassifyResponse struct {
	Label      string  `json:"label"`
	Confidence float64 `json:"confidence"`
}

// Embed memanggil ai-service untuk menghasilkan embedding teks via BGE-M3.
func (c *AIClient) Embed(ctx context.Context, texts []string) (*EmbedResponse, error) {
	var resp EmbedResponse
	if err := c.postJSON(ctx, "/embed", EmbedRequest{Texts: texts}, &resp); err != nil {
		return nil, fmt.Errorf("gagal memanggil ai-service /embed: %w", err)
	}
	return &resp, nil
}

// Classify memanggil ai-service untuk klasifikasi teks via IndoBERT.
func (c *AIClient) Classify(ctx context.Context, text string, labels []string) (*ClassifyResponse, error) {
	var resp ClassifyResponse
	if err := c.postJSON(ctx, "/classify", ClassifyRequest{Text: text, Labels: labels}, &resp); err != nil {
		return nil, fmt.Errorf("gagal memanggil ai-service /classify: %w", err)
	}
	return &resp, nil
}

// postJSON adalah helper HTTP POST dengan JSON body dan response decode.
func (c *AIClient) postJSON(ctx context.Context, path string, reqBody, respBody interface{}) error {
	b, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("ai-service request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ai-service error: status %d", resp.StatusCode)
	}

	return json.NewDecoder(resp.Body).Decode(respBody)
}
