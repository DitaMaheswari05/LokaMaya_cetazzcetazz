package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"lokamaya/api-go/internal/client"
	"lokamaya/api-go/internal/model"
)

// ChatService menangani orkestrasi AI Chatbot dengan Function Calling (Tool Calling).
type ChatService struct {
	litellm         *client.LiteLLMClient
	analysisService *AnalysisService
}

func NewChatService(litellm *client.LiteLLMClient, analysisService *AnalysisService) *ChatService {
	return &ChatService{
		litellm:         litellm,
		analysisService: analysisService,
	}
}

// HandleChat memproses pesan pengguna, mengeksekusi tool calling jika diperlukan, dan menyusun jawaban.
func (s *ChatService) HandleChat(ctx context.Context, req *model.ChatRequest, userID *string) (*model.ChatResponse, error) {
	systemPrompt := `Kamu adalah LokaMaya Assistant, AI asisten spatial intelligence untuk perencanaan transportasi massal dan halte TransJakarta.
Peranmu:
1. Membantu pengguna memahami dampak pemindahan, penambahan, atau penutupan halte.
2. Jika pengguna meminta simulasi lokasi atau bertanya dampak perubahan halte, PANGGIL FUNCTION 'simulate_stop'.
3. Jika pengguna bertanya tentang karakteristik area tertentu, panggil 'query_area_insight'.
4. Jelaskan hasil simulasi dengan bahasa ramah, terstruktur, dan transparan.
5. PENTING: Jangan pernah menghitung angka sendiri. Seluruh skor dihitung oleh sistem PostGIS melalui function calling.`

	messages := []client.ChatMessage{
		{Role: "system", Content: systemPrompt},
	}

	// Masukkan history percakapan
	for _, h := range req.History {
		messages = append(messages, client.ChatMessage{
			Role:    h.Role,
			Content: h.Content,
		})
	}

	// Jika ada ContextLocation (Context Chip dari peta)
	userMessage := req.Message
	if req.ContextLocation != nil {
		userMessage += fmt.Sprintf("\n[Context Pin Titik Peta: %s di Lat: %.5f, Lng: %.5f]",
			req.ContextLocation.StopName, req.ContextLocation.Latitude, req.ContextLocation.Longitude)
	}

	messages = append(messages, client.ChatMessage{
		Role:    "user",
		Content: userMessage,
	})

	tools := client.DefaultTools()

	// 1. Panggil LiteLLM dengan Tools
	assistantMsg, err := s.litellm.ChatWithTools(ctx, "gemini/gemini-1.5-flash", messages, tools)
	if err != nil {
		// Fallback cerdas jika LiteLLM offline atau error
		return s.heuristicChatFallback(ctx, req, userID)
	}

	var triggeredSim *model.SimulationResult
	var executedTool string

	// 2. Cek apakah model meminta Tool Call
	if len(assistantMsg.ToolCalls) > 0 {
		toolCall := assistantMsg.ToolCalls[0]
		executedTool = toolCall.Function.Name

		if executedTool == "simulate_stop" {
			var args struct {
				Latitude     float64 `json:"latitude"`
				Longitude    float64 `json:"longitude"`
				ScenarioType string  `json:"scenario_type"`
				StopName     string  `json:"stop_name"`
			}

			if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err == nil {
				// Jalankan spatial engine
				simReq := &model.SimulateRequest{
					Latitude:     args.Latitude,
					Longitude:    args.Longitude,
					ScenarioType: args.ScenarioType,
					StopName:     args.StopName,
				}

				simRes, err := s.analysisService.RunSimulation(ctx, simReq, userID)
				if err == nil {
					triggeredSim = simRes

					// Kirim hasil tool execution kembali ke model untuk penjelasan akhir
					simJSON, _ := json.Marshal(simRes)
					messages = append(messages, *assistantMsg)
					messages = append(messages, client.ChatMessage{
						Role:       "tool",
						Name:       "simulate_stop",
						ToolCallID: toolCall.ID,
						Content:    string(simJSON),
					})

					finalReply, err := s.litellm.Complete(ctx, "gemini/gemini-1.5-flash", messages)
					if err == nil && finalReply != "" {
						return &model.ChatResponse{
							Message:             finalReply,
							TriggeredSimulation: triggeredSim,
							ToolExecuted:        executedTool,
							SuggestedQuestions: []string{
								"Bagaimana jika dibandingkan dengan halte eksisting terdekat?",
								"Apakah ada risiko banjir di titik ini?",
								"Berapa estimasi warga yang terlayani dalam 5 menit?",
							},
						}, nil
					}
				}
			}
		}
	}

	replyContent := assistantMsg.Content
	if replyContent == "" && triggeredSim != nil {
		replyContent = triggeredSim.AINarrative
	}

	return &model.ChatResponse{
		Message:             replyContent,
		TriggeredSimulation: triggeredSim,
		ToolExecuted:        executedTool,
		SuggestedQuestions: []string{
			"Simulasikan tambah halte baru di sekitar sini",
			"Tampilkan layer kepadatan UMKM di sekitar lokasi",
			"Bandingkan skenario halte ini dengan skenario alternatif",
		},
	}, nil
}

func (s *ChatService) heuristicChatFallback(ctx context.Context, req *model.ChatRequest, userID *string) (*model.ChatResponse, error) {
	lower := strings.ToLower(req.Message)

	// Jika ada koordinat pada context chip atau kata kunci simulasi
	if req.ContextLocation != nil || strings.Contains(lower, "simulasi") || strings.Contains(lower, "halte") || strings.Contains(lower, "pindah") || strings.Contains(lower, "tambah") {
		lat := -6.2238
		lng := 106.8025
		name := "Kandidat Halte"

		if req.ContextLocation != nil {
			lat = req.ContextLocation.Latitude
			lng = req.ContextLocation.Longitude
			if req.ContextLocation.StopName != "" {
				name = req.ContextLocation.StopName
			}
		}

		scenario := "tambah"
		if strings.Contains(lower, "pindah") {
			scenario = "pindah"
		} else if strings.Contains(lower, "tutup") {
			scenario = "tutup"
		}

		simRes, _ := s.analysisService.RunSimulation(ctx, &model.SimulateRequest{
			Latitude:     lat,
			Longitude:    lng,
			ScenarioType: scenario,
			StopName:     name,
		}, userID)

		return &model.ChatResponse{
			Message: fmt.Sprintf(
				"Saya telah menjalankan simulasi spasial untuk **%s** (%s):\n\n- **Akses Jalan Kaki**: %d/100 (Est. %d jiwa dalam 5 menit)\n- **Ekonomi UMKM**: %d/100 (%d transaksi Struk Go & %d PKL Menu Go)\n- **Kelayakan Lokasi**: %s (Zonasi: %s, Risiko Banjir: %s)\n\n%s",
				simRes.StopName, simRes.ScenarioType,
				simRes.WalkAccessibility.Score, simRes.WalkAccessibility.EstimatedReach5Min,
				simRes.UMKMEconomic.Score, simRes.UMKMEconomic.StrukGoTransactions, simRes.UMKMEconomic.InformalVendorCount,
				simRes.SiteFeasibility.Status, simRes.SiteFeasibility.ZoneName, simRes.SiteFeasibility.FloodRisk,
				simRes.AINarrative,
			),
			TriggeredSimulation: simRes,
			ToolExecuted:        "simulate_stop",
			SuggestedQuestions: []string{
				"Lihat rincian komponen skor",
				"Bandingkan dengan halte alternatif",
				"Unduh ringkasan simulasi (PDF)",
			},
		}, nil
	}

	return &model.ChatResponse{
		Message: "Halo! Saya LokaMaya AI Assistant. Anda dapat mengklik titik manapun di peta untuk menambahkan pin ke obrolan ini, atau tanyakan skenario perubahan halte seperti: *'Bagaimana dampaknya jika halte Senayan dipindah 300m ke utara?'*",
		SuggestedQuestions: []string{
			"Simulasikan penambahan halte di Benhil",
			"Bagaimana cara membaca skor kelayakan lokasi?",
			"Apa saja dataset yang digunakan LokaMaya?",
		},
	}, nil
}
