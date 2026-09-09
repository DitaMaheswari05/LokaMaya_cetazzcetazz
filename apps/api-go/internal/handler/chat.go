package handler

import (
	"encoding/json"
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
