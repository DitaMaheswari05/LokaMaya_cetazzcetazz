package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"lokamaya/api-go/internal/model"
	"lokamaya/api-go/internal/service"
)

// ChatHandler menangani interaksi pengguna dengan AI Chatbot LokaMaya.
type ChatHandler struct {
	chatService *service.ChatService
}

func NewChatHandler(chatService *service.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

// Chat memproses pesan teks pengguna dan mengembalikan jawaban AI (dengan tool calling bila relevan).
// POST /api/v1/chat
func (h *ChatHandler) Chat(w http.ResponseWriter, r *http.Request) {
	var req model.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Format request tidak valid (harus JSON)",
		})
		return
	}

	if req.Message == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Pesan chat tidak boleh kosong",
		})
		return
	}

	var userID *string
	if user, ok := r.Context().Value("user").(*model.Claims); ok && user != nil {
		userID = &user.UserID
	}

	resp, err := h.chatService.HandleChat(r.Context(), &req, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// ChatStream menangani streaming Server-Sent Events (SSE) untuk interaksi AI Chatbot.
// POST /api/v1/chat/stream
func (h *ChatHandler) ChatStream(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming tidak didukung pada koneksi ini", http.StatusInternalServerError)
		return
	}

	var req model.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Format request tidak valid (harus JSON)",
		})
		return
	}

	if req.Message == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Pesan chat tidak boleh kosong",
		})
		return
	}

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	sendSSE := func(event string, data interface{}) {
		b, err := json.Marshal(data)
		if err == nil {
			fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, string(b))
			flusher.Flush()
		}
	}

	var userID *string
	if user, ok := r.Context().Value("user").(*model.Claims); ok && user != nil {
		userID = &user.UserID
	}

	onStatus := func(stage, msg string, step, total int) {
		sendSSE("status", map[string]interface{}{
			"stage":       stage,
			"message":     msg,
			"step":        step,
			"total_steps": total,
		})
	}

	onDelta := func(chunk string) {
		sendSSE("delta", map[string]string{
			"text": chunk,
		})
	}

	resp, err := h.chatService.HandleChatStream(r.Context(), &req, userID, onStatus, onDelta)
	if err != nil {
		sendSSE("error", map[string]string{
			"error": err.Error(),
		})
		return
	}

	sendSSE("complete", resp)
}
