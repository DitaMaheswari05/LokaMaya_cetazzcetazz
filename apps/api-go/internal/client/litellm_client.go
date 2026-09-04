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
// LiteLLM meneruskan request ke provider AI yang dikonfigurasi (Google AI Studio, dll).
// Menggunakan format OpenAI Chat Completions API.
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

// ChatMessage merepresentasikan satu pesan dalam chat completion.
type ChatMessage struct {
	Role    string `json:"role"`    // "system", "user", "assistant"
	Content string `json:"content"`
}

// ChatCompletionRequest adalah request body OpenAI-compatible untuk LiteLLM.
type ChatCompletionRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	Stream   bool          `json:"stream,omitempty"`
}

// ChatCompletionResponse adalah respons dari LiteLLM (OpenAI-compatible).
type ChatCompletionResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
}

// Complete mengirim chat completion request ke LiteLLM dan mengembalikan teks respons.
// TODO: implementasi
func (c *LiteLLMClient) Complete(ctx context.Context, model string, messages []ChatMessage) (string, error) {
	// TODO: implementasi
	_ = ctx
	return "", fmt.Errorf("belum diimplementasi")
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
		return fmt.Errorf("litellm error: status %d", resp.StatusCode)
	}

	return json.NewDecoder(resp.Body).Decode(respBody)
}
