package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"lokamaya/api-go/internal/client"
	"lokamaya/api-go/internal/model"
)

// StreamStatusCallback mengirimkan update status fase yang sedang dikerjakan AI.
type StreamStatusCallback func(stage string, message string, step int, totalSteps int)

// StreamDeltaCallback mengirimkan potongan kata/token secara real-time.
type StreamDeltaCallback func(chunk string)

func streamTextChunks(ctx context.Context, text string, onDelta StreamDeltaCallback) {
	if onDelta == nil || text == "" {
		return
	}
	words := strings.Fields(text)
	chunkSize := 2
	for i := 0; i < len(words); i += chunkSize {
		select {
		case <-ctx.Done():
			return
		default:
		}
		end := i + chunkSize
		if end > len(words) {
			end = len(words)
		}
		chunk := strings.Join(words[i:end], " ") + " "
		onDelta(chunk)
		time.Sleep(16 * time.Millisecond)
	}
}

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

// HandleChat memproses pesan pengguna secara sinkron tanpa streaming (tetap kompatibel dengan endpoint reguler).
func (s *ChatService) HandleChat(ctx context.Context, req *model.ChatRequest, userID *string) (*model.ChatResponse, error) {
	return s.HandleChatStream(ctx, req, userID, nil, nil)
}

// HandleChatStream memproses pesan pengguna dengan dukungan real-time stage status updates dan token streaming.
func (s *ChatService) HandleChatStream(
	ctx context.Context,
	req *model.ChatRequest,
	userID *string,
	onStatus StreamStatusCallback,
	onDelta StreamDeltaCallback,
) (*model.ChatResponse, error) {
	if onStatus != nil {
		onStatus("understanding", "Menganalisis pertanyaan & mencocokkan konteks spasial...", 1, 3)
	}

	systemPrompt := `Kamu adalah LokaMaya Assistant, AI asisten spatial intelligence untuk perencanaan transportasi massal dan halte TransJakarta.
Peranmu:
1. Membantu pengguna memahami dampak pemindahan, penambahan, atau penutupan halte.
2. Jika pengguna meminta simulasi penambahan halte baru atau evaluasi lokasi tertentu, panggil function 'simulate_stop'.
3. PENTING UNTUK RELOKASI: Jika pengguna bertanya tentang relokasi/pemindahan halte eksisting tetapi BELUM menentukan koordinat lokasi tujuan baru di peta, evaluasi kelemahan/performa halte eksisting saat ini terlebih dahulu (skor jalan kaki, kerawanan banjir, akses UMKM), berikan saran arah relokasi yang logis di sekitarnya, dan beri tahu pengguna untuk mengklik titik baru di peta (atau gunakan tombol 'Pindah' untuk mengaktifkan Mode Relokasi). JANGAN memindahkan halte ke koordinat asalnya sendiri.
4. Jika pengguna bertanya tentang karakteristik area tertentu, panggil 'query_area_insight'.
5. Jika pengguna bertanya perjalanan dari Titik A ke Titik B atau mencari bottleneck antar 2 titik, panggil function 'analyze_od_trip'.
6. Jelaskan hasil simulasi dengan bahasa ramah, terstruktur, dan transparan.
7. PENTING: Jangan pernah menghitung angka sendiri. Seluruh skor dihitung oleh sistem PostGIS melalui function calling.`

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
	if req.OriginLocation != nil && req.DestinationLocation != nil {
		userMessage += fmt.Sprintf("\n[Context Perjalanan OD: Titik Asal A: %s (Lat: %.5f, Lng: %.5f) menuju Titik Tujuan B: %s (Lat: %.5f, Lng: %.5f)]",
			req.OriginLocation.Name, req.OriginLocation.Latitude, req.OriginLocation.Longitude,
			req.DestinationLocation.Name, req.DestinationLocation.Latitude, req.DestinationLocation.Longitude)
	}

	messages = append(messages, client.ChatMessage{
		Role:    "user",
		Content: userMessage,
	})

	tools := client.DefaultTools()

	// 1. Panggil LiteLLM dengan Tools (dengan fallback direct Gemini)
	assistantMsg, err := s.litellm.ChatWithTools(ctx, client.DefaultModel, messages, tools)
	if err != nil {
		// Fallback cerdas jika LiteLLM offline atau error
		return s.heuristicChatFallback(ctx, req, userID, onStatus, onDelta)
	}

	var triggeredSim *model.SimulationResult
	var executedTool string

	// 2. Cek apakah model meminta Tool Call
	if len(assistantMsg.ToolCalls) > 0 {
		toolCall := assistantMsg.ToolCalls[0]
		executedTool = toolCall.Function.Name

		switch executedTool {
		case "simulate_stop":
			var args struct {
				Latitude     float64 `json:"latitude"`
				Longitude    float64 `json:"longitude"`
				ScenarioType string  `json:"scenario_type"`
				StopName     string  `json:"stop_name"`
			}
			if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err == nil {
				if onStatus != nil {
					dispName := args.StopName
					if dispName == "" {
						dispName = "titik usulan"
					}
					onStatus("simulating", fmt.Sprintf("Menjalankan simulasi spasial untuk %s di PostGIS...", dispName), 2, 3)
				}
				simReq := &model.SimulateRequest{
					Latitude:     args.Latitude,
					Longitude:    args.Longitude,
					ScenarioType: args.ScenarioType,
					StopName:     args.StopName,
				}
				simRes, err := s.analysisService.RunSimulation(ctx, simReq, userID)
				if err == nil {
					triggeredSim = simRes
					simJSON, _ := json.Marshal(simRes)
					messages = append(messages, *assistantMsg)
					messages = append(messages, client.ChatMessage{
						Role:       "tool",
						Name:       "simulate_stop",
						ToolCallID: toolCall.ID,
						Content:    string(simJSON),
					})
					if onStatus != nil {
						onStatus("synthesizing", "Merangkum narasi analisis spasial...", 3, 3)
					}
					finalReply, err := s.litellm.Complete(ctx, client.DefaultModel, messages)
					if err == nil && finalReply != "" {
						streamTextChunks(ctx, finalReply, onDelta)
						return &model.ChatResponse{
							Message:             finalReply,
							TriggeredSimulation: triggeredSim,
							ToolExecuted:        executedTool,
							SuggestedQuestions: []string{
								"Bagaimana musyawarah Dewan Kota (Rina, Siti, Andi)?",
								"Buatkan Policy Brief untuk usulan halte ini",
								"Bandingkan dengan halte eksisting terdekat",
							},
						}, nil
					}
				}
			}

		case "deliberate_stakeholders":
			var args struct {
				Latitude     float64 `json:"latitude"`
				Longitude    float64 `json:"longitude"`
				ScenarioType string  `json:"scenario_type"`
				StopName     string  `json:"stop_name"`
			}
			if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err == nil {
				if onStatus != nil {
					onStatus("deliberating", "Memanggil musyawarah AI Urban Council (Warga, UMKM, Dishub)...", 2, 3)
				}
				simReq := &model.SimulateRequest{
					Latitude:     args.Latitude,
					Longitude:    args.Longitude,
					ScenarioType: args.ScenarioType,
					StopName:     args.StopName,
				}
				simRes, _ := s.analysisService.RunSimulation(ctx, simReq, userID)
				if simRes != nil {
					triggeredSim = simRes
					delib, err := s.analysisService.DeliberateStakeholders(ctx, simRes)
					if err == nil {
						delibJSON, _ := json.Marshal(delib)
						messages = append(messages, *assistantMsg)
						messages = append(messages, client.ChatMessage{
							Role:       "tool",
							Name:       "deliberate_stakeholders",
							ToolCallID: toolCall.ID,
							Content:    string(delibJSON),
						})
						if onStatus != nil {
							onStatus("synthesizing", "Merangkum konsensus musyawarah dewan...", 3, 3)
						}
						finalReply, err := s.litellm.Complete(ctx, client.DefaultModel, messages)
						if err == nil && finalReply != "" {
							streamTextChunks(ctx, finalReply, onDelta)
							return &model.ChatResponse{
								Message:             finalReply,
								TriggeredSimulation: triggeredSim,
								ToolExecuted:        executedTool,
								SuggestedQuestions: []string{
									"Buatkan Policy Brief resmi dari hasil musyawarah ini",
									"Bagaimana cara memitigasi keberatan Bu Siti?",
									"Berapa skor aksesibilitas pejalan kakinya?",
								},
							}, nil
						}
					}
				}
			}

		case "find_optimal_stops":
			var args struct {
				CorridorName    string  `json:"corridor_name"`
				CenterLatitude  float64 `json:"center_latitude"`
				CenterLongitude float64 `json:"center_longitude"`
			}
			if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err == nil {
				if args.CenterLatitude == 0 && args.CenterLongitude == 0 && req.ContextLocation != nil {
					args.CenterLatitude = req.ContextLocation.Latitude
					args.CenterLongitude = req.ContextLocation.Longitude
				}
				if (args.CorridorName == "" || strings.Contains(strings.ToLower(args.CorridorName), "daerah") || strings.Contains(strings.ToLower(args.CorridorName), "area")) && req.ContextLocation != nil && req.ContextLocation.StopName != "" {
					args.CorridorName = req.ContextLocation.StopName
				}
				if onStatus != nil {
					dispCorridor := args.CorridorName
					if dispCorridor == "" {
						dispCorridor = "koridor terpilih"
					}
					onStatus("optimizing", fmt.Sprintf("Mengevaluasi titik halte Pareto-optimal di %s...", dispCorridor), 2, 3)
				}
				optRes, err := s.analysisService.FindOptimalStops(ctx, args.CorridorName, args.CenterLatitude, args.CenterLongitude, userID)
				if err == nil {
					var trig *model.SimulationResult
					if len(optRes.TopCandidates) > 0 {
						trig = &optRes.TopCandidates[0].SimulationResult
					}
					optJSON, _ := json.Marshal(optRes)
					messages = append(messages, *assistantMsg)
					messages = append(messages, client.ChatMessage{
						Role:       "tool",
						Name:       "find_optimal_stops",
						ToolCallID: toolCall.ID,
						Content:    string(optJSON),
					})
					if onStatus != nil {
						onStatus("synthesizing", "Merangkum rekomendasi halte terbaik...", 3, 3)
					}
					finalReply, err := s.litellm.Complete(ctx, client.DefaultModel, messages)
					if err == nil && finalReply != "" {
						streamTextChunks(ctx, finalReply, onDelta)
						return &model.ChatResponse{
							Message:             finalReply,
							TriggeredSimulation: trig,
							ToolExecuted:        executedTool,
							SuggestedQuestions: []string{
								"Pilih Kandidat 1 dan simulasikan",
								"Bahas kandidat ini di AI Urban Council",
								"Cari koridor jalan lainnya",
							},
						}, nil
					}

					// Fallback deterministik jika LLM completion tidak merespons
					var sb strings.Builder
					sb.WriteString(fmt.Sprintf("### 🎯 Rekomendasi Titik Halte Pareto-Optimal: %s\n\n", optRes.CorridorName))
					sb.WriteString(fmt.Sprintf("Sistem LokaMaya telah mensimulasikan **%d titik kandidat** secara spasial dan merekomendasikan opsi Pareto berikut:\n\n", optRes.TotalSampled))
					for _, c := range optRes.TopCandidates {
						sb.WriteString(fmt.Sprintf("#### %d. %s\n", c.Rank, c.Title))
						sb.WriteString(fmt.Sprintf("- **Nama / Titik**: %s (%.4f, %.4f)\n", c.SimulationResult.StopName, c.Latitude, c.Longitude))
						sb.WriteString(fmt.Sprintf("- **Skor Spasial**: Akses Pejalan Kaki **%d/100** | Potensi UMKM **%d/100**\n",
							c.SimulationResult.WalkAccessibility.Score,
							c.SimulationResult.UMKMEconomic.Score))
						sb.WriteString(fmt.Sprintf("- **Tata Ruang & Banjir**: Zonasi %s (**%s**) | Risiko Genangan **%s**\n",
							c.SimulationResult.SiteFeasibility.ZoneName,
							c.SimulationResult.SiteFeasibility.Status,
							c.SimulationResult.SiteFeasibility.FloodRisk))
						sb.WriteString(fmt.Sprintf("- **Alasan Rekomendasi**: %s\n\n", c.Reason))
					}
					resultText := sb.String()
					streamTextChunks(ctx, resultText, onDelta)
					return &model.ChatResponse{
						Message:             resultText,
						TriggeredSimulation: trig,
						ToolExecuted:        executedTool,
						SuggestedQuestions: []string{
							"Pilih Kandidat 1 dan simulasikan",
							"Bahas kandidat ini di AI Urban Council",
							"Cari koridor jalan lainnya",
						},
					}, nil
				}
			}

		case "generate_policy_brief":
			var args struct {
				Latitude     float64 `json:"latitude"`
				Longitude    float64 `json:"longitude"`
				ScenarioType string  `json:"scenario_type"`
				StopName     string  `json:"stop_name"`
			}
			if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err == nil {
				if onStatus != nil {
					onStatus("drafting", "Menyusun naskah advokasi kebijakan formal Pemprov DKI...", 2, 3)
				}
				simReq := &model.SimulateRequest{
					Latitude:     args.Latitude,
					Longitude:    args.Longitude,
					ScenarioType: args.ScenarioType,
					StopName:     args.StopName,
				}
				simRes, _ := s.analysisService.RunSimulation(ctx, simReq, userID)
				if simRes != nil {
					triggeredSim = simRes
					brief, err := s.analysisService.GeneratePolicyBrief(ctx, simRes)
					if err == nil {
						if onStatus != nil {
							onStatus("synthesizing", "Menuntaskan format Policy Brief...", 3, 3)
						}
						streamTextChunks(ctx, brief, onDelta)
						return &model.ChatResponse{
							Message:             brief,
							TriggeredSimulation: triggeredSim,
							ToolExecuted:        executedTool,
							SuggestedQuestions: []string{
								"Bahas klausul RDTR lebih mendalam",
								"Bagaimana solusi mitigasi untuk pedagang informal?",
								"Simulasikan titik koordinat lain",
							},
						}, nil
					}
				}
			}

		case "analyze_od_trip":
			var args struct {
				OriginLat  float64 `json:"origin_lat"`
				OriginLng  float64 `json:"origin_lng"`
				OriginName string  `json:"origin_name"`
				DestLat    float64 `json:"dest_lat"`
				DestLng    float64 `json:"dest_lng"`
				DestName   string  `json:"dest_name"`
			}
			if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err == nil {
				// Fallback ke OriginLocation / DestinationLocation yang dikirim dari state frontend
				if args.OriginLat == 0 && args.OriginLng == 0 && req.OriginLocation != nil {
					args.OriginLat = req.OriginLocation.Latitude
					args.OriginLng = req.OriginLocation.Longitude
					if args.OriginName == "" {
						args.OriginName = req.OriginLocation.Name
					}
				}
				if args.DestLat == 0 && args.DestLng == 0 && req.DestinationLocation != nil {
					args.DestLat = req.DestinationLocation.Latitude
					args.DestLng = req.DestinationLocation.Longitude
					if args.DestName == "" {
						args.DestName = req.DestinationLocation.Name
					}
				}

				// Jika koordinat masih kosong, berikan panduan interaktif dan demo rute
				if args.OriginLat == 0 || args.DestLat == 0 {
					msg := "### 🗺️ Analisis Bottleneck Perjalanan Komuter (Titik A → Titik B)\n\n" +
						"Untuk mendeteksi bottleneck perjalanan komuter dan solusinya, silakan tentukan **Titik Asal (A)** dan **Titik Tujuan (B)** pada peta:\n\n" +
						"📍 **Cara Menentukan Titik di Peta:**\n" +
						"1. Klik titik awal di peta, lalu pilih tombol **`Set Titik A`**.\n" +
						"2. Klik titik tujuan di peta, lalu pilih tombol **`Set Titik B`**.\n" +
						"3. Atau sebutkan nama lokasi secara langsung di chat (misal: *'Analisis rute dari Dukuh Atas ke Senayan'* atau *'Cek bottleneck dari Tebet ke Manggarai'*).\n\n" +
						"Sistem LokaMaya akan secara otomatis menghitung jarak first-mile/last-mile, transfer antar-koridor, serta mensimulasikan perbandingan waktu tempuh **As-Is vs To-Be**."
					streamTextChunks(ctx, msg, onDelta)
					return &model.ChatResponse{
						Message:      msg,
						ToolExecuted: executedTool,
						SuggestedQuestions: []string{
							"Analisis rute dari Tebet Barat ke Manggarai",
							"Analisis rute dari Kuningan ke Kelapa Gading",
							"Bagaimana cara menetapkan Titik A dan B di peta?",
						},
					}, nil
				}

				if onStatus != nil {
					dispOrig := args.OriginName
					if dispOrig == "" {
						dispOrig = fmt.Sprintf("%.3f, %.3f", args.OriginLat, args.OriginLng)
					}
					dispDest := args.DestName
					if dispDest == "" {
						dispDest = fmt.Sprintf("%.3f, %.3f", args.DestLat, args.DestLng)
					}
					onStatus("analyzing_od", fmt.Sprintf("Menganalisis bottleneck & komparasi komuter dari %s ke %s...", dispOrig, dispDest), 2, 3)
				}
				origin := model.ODLocation{
					Latitude:  args.OriginLat,
					Longitude: args.OriginLng,
					Name:      args.OriginName,
				}
				dest := model.ODLocation{
					Latitude:  args.DestLat,
					Longitude: args.DestLng,
					Name:      args.DestName,
				}
				odRes, err := s.analysisService.AnalyzeODTrip(ctx, origin, dest, userID)
				if err == nil {
					if onStatus != nil {
						onStatus("synthesizing", "Merangkum narasi bottleneck komuter & komparasi To-Be vs As-Is...", 3, 3)
					}
					streamTextChunks(ctx, odRes.AINarrative, onDelta)
					return &model.ChatResponse{
						Message:         odRes.AINarrative,
						TriggeredODTrip: odRes,
						ToolExecuted:    executedTool,
						SuggestedQuestions: []string{
							"Simulasikan halte rekomendasi di AI Urban Council",
							"Bagaimana cara memitigasi risiko genangan di rute ini?",
							"Tampilkan perbandingan rute di peta",
						},
					}, nil
				} else {
					errMsg := fmt.Sprintf("Mohon maaf, terjadi kendala saat menganalisis rute dari %s ke %s: %v. Pastikan kedua titik berada dalam jangkauan jalan DKI Jakarta.", origin.Name, dest.Name, err)
					streamTextChunks(ctx, errMsg, onDelta)
					return &model.ChatResponse{
						Message:      errMsg,
						ToolExecuted: executedTool,
					}, nil
				}
			}

		case "query_area_insight":
			var args struct {
				Latitude  float64 `json:"latitude"`
				Longitude float64 `json:"longitude"`
			}
			if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err != nil {
				log.Printf("[ChatService] warning: failed to parse query_area_insight args: %v", err)
			}
			if args.Latitude == 0 && req.ContextLocation != nil {
				args.Latitude = req.ContextLocation.Latitude
				args.Longitude = req.ContextLocation.Longitude
			}
			if args.Latitude == 0 {
				args.Latitude = -6.2146
				args.Longitude = 106.8273
			}

			simReq := &model.SimulateRequest{
				Latitude:     args.Latitude,
				Longitude:    args.Longitude,
				ScenarioType: "tambah",
				StopName:     "Area Sekitar",
			}
			simRes, _ := s.analysisService.RunSimulation(ctx, simReq, userID)

			var sb strings.Builder
			sb.WriteString(fmt.Sprintf("### 🏪 Analisis Kepadatan & Potensi Ekonomi UMKM di Sekitar Lokasi (%.4f, %.4f)\n\n", args.Latitude, args.Longitude))
			if simRes != nil {
				sb.WriteString(fmt.Sprintf("- **Skor Potensi UMKM**: **%d/100** (Kategori: %s)\n", simRes.UMKMEconomic.Score, simRes.UMKMEconomic.Category))
				sb.WriteString(fmt.Sprintf("- **Persebaran UMKM**: Terdata **%d transaksi Struk Go** dan **%d pedagang informal (PKL)** terpetakan (sumber data: agregasi struk transaksi & merchant GoFood/GrabFood).\n", simRes.UMKMEconomic.StrukGoTransactions, simRes.UMKMEconomic.InformalVendorCount))
			} else {
				sb.WriteString("- **Persebaran UMKM**: Terdapat klaster usaha mikro dan kuliner lokal aktif di sekitar kawasan ini.\n")
			}
			sb.WriteString("- **Aktivasi Layer Peta**: Layer spasial **UMKM (Struk/Menu Go)** telah diaktifkan di peta untuk memvisualisasikan titik-titik usaha warga secara langsung.\n")
			sb.WriteString("- **Rekomendasi Penataan**: Menempatkan akses halte di dekat konsentrasi UMKM ini akan mempertemukan arus ribuan komuter dengan pedagang lokal, menciptakan simpul ekonomi mikro transit yang produktif dan tertata rapi.")

			msg := sb.String()
			streamTextChunks(ctx, msg, onDelta)
			return &model.ChatResponse{
				Message:             msg,
				ActiveLayerToggle:   "umkm",
				TriggeredSimulation: simRes,
				ToolExecuted:        executedTool,
				SuggestedQuestions: []string{
					"Bagaimana dampak penataan halte terhadap omzet pedagang lokal?",
					"Tampilkan layer rawan banjir di lokasi ini",
					"Simulasikan halte baru di titik ini",
				},
			}, nil

		case "explain_score":
			var args struct {
				ScoreType string `json:"score_type"`
			}
			if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err != nil {
				log.Printf("[ChatService] warning: failed to parse explain_score args: %v", err)
			}
			msg := ""
			switch args.ScoreType {
			case "ekonomi_umkm":
				msg = "### 📊 Metodologi Skor Potensi Ekonomi UMKM (Bobot 35%)\n\n" +
					"Skor Ekonomi UMKM dihitung menggunakan algoritma *Kernel Density Estimation* (KDE) berdasarkan sebaran geospasial unit usaha mikro dalam radius jalan kaki halte:\n\n" +
					"1. **Radius Inti (0–300 meter)**: Memiliki bobot 60% terhadap skor karena berada dalam jangkauan 3–4 menit jalan kaki komuter.\n" +
					"2. **Radius Sekunder (300–500 meter)**: Memiliki bobot 40% terhadap skor.\n" +
					"3. **Klasifikasi Rating**: Skor $\\ge 70$ (*Sangat Potensial*), $50-69$ (*Cukup Potensial*), $< 50$ (*Rendah*).\n\n" +
					"Tujuan penilaian ini adalah memastikan pembangunan halte dapat mengalirkan *foot-traffic* komuter ke pedagang lokal tanpa menimbulkan kesemrawutan trotoar."
			case "kelayakan_lokasi":
				msg = "### 📊 Metodologi Skor Kelayakan Lokasi & Tata Ruang (Bobot 25%)\n\n" +
					"Skor Kelayakan Lokasi menguji kepatuhan teknis dan tata ruang terhadap regulasi Pemprov DKI Jakarta:\n\n" +
					"1. **Kesesuaian RDTR DKI**: Verifikasi zonasi lahan (Zona Jalan/Komersial/Perkantoran bernilai maksimal; Zona RTH/Hutan Kota dilarang).\n" +
					"2. **Risiko Genangan Banjir (BPBD)**: Penalti skor signifikan jika titik halte berada pada area genangan banjir historis $\\ge 30\\text{cm}$.\n" +
					"3. **Hierarki Jalan**: Memprioritaskan jalan arteri primer, arteri sekunder, dan kolektor utama."
			default:
				msg = "### 📊 Metodologi Skor Aksesibilitas Pejalan Kaki (Bobot 40%)\n\n" +
					"Skor ini mengukur kemudahan aksesibilitas komuter mencapai halte berdasarkan jaringan pedestrian nyata:\n\n" +
					"1. **Isochrone Jarak Tempuh**: Dihitung berdasarkan polygon jalan kaki 5 menit ($\\le 400\\text{m}$) dan 10 menit ($\\le 800\\text{m}$).\n" +
					"2. **Pedestrian Strain**: Mengukur beban fisik pejalan kaki (*Nyaman*, *Sedang*, *Sangat Berat*).\n" +
					"3. **Interkoneksi Koridor**: Ketersediaan skybridge atau penyeberangan aman menuju halte transit terdekat."
			}
			streamTextChunks(ctx, msg, onDelta)
			return &model.ChatResponse{
				Message:      msg,
				ToolExecuted: executedTool,
				SuggestedQuestions: []string{
					"Jelaskan Skor Akses Jalan Kaki",
					"Jelaskan Skor Ekonomi UMKM",
					"Jelaskan Skor Kelayakan Lokasi & RDTR",
				},
			}, nil
		}
	}

	replyContent := assistantMsg.Content
	if replyContent == "" && triggeredSim != nil {
		replyContent = triggeredSim.AINarrative
	}

	// Jaminan Mutlak: Pesan jawaban AI TIDAK BOLEH kosong
	if strings.TrimSpace(replyContent) == "" {
		fallbackResp, fbErr := s.heuristicChatFallback(ctx, req, userID, onStatus, onDelta)
		if fbErr == nil && fallbackResp != nil && strings.TrimSpace(fallbackResp.Message) != "" {
			return fallbackResp, nil
		}

		directText, dirErr := s.litellm.Complete(ctx, client.DefaultModel, []client.ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: req.Message},
		})
		if dirErr == nil && strings.TrimSpace(directText) != "" {
			streamTextChunks(ctx, directText, onDelta)
			return &model.ChatResponse{
				Message: directText,
			}, nil
		}

		defaultMsg := "Halo! Saya adalah LokaMaya Assistant, AI asisten spatial intelligence TransJakarta. Saya siap membantu Anda menganalisis penataan halte, memeriksa bottleneck perjalanan (Titik A ke B), serta memvisualisasikan data spasial UMKM dan tata ruang di peta."
		streamTextChunks(ctx, defaultMsg, onDelta)
		return &model.ChatResponse{
			Message: defaultMsg,
		}, nil
	}

	if onStatus != nil {
		onStatus("synthesizing", "Menuntaskan tanggapan...", 3, 3)
	}
	streamTextChunks(ctx, replyContent, onDelta)

	return &model.ChatResponse{
		Message:             replyContent,
		TriggeredSimulation: triggeredSim,
		ToolExecuted:        executedTool,
		SuggestedQuestions: []string{
			"Simulasikan tambah halte baru di sekitar sini",
			"Tampilkan layer kepadatan UMKM di sekitar lokasi",
			"Bahas di Musyawarah Dewan Kota (AI Urban Council)",
		},
	}, nil
}

func (s *ChatService) heuristicChatFallback(ctx context.Context, req *model.ChatRequest, userID *string, onStatus StreamStatusCallback, onDelta StreamDeltaCallback) (*model.ChatResponse, error) {
	lower := strings.ToLower(req.Message)

	// 0a. Cek apakah pengguna menanyakan rute perjalanan 2 titik / bottleneck (Titik A -> Titik B)
	isODTrip := (req.OriginLocation != nil && req.DestinationLocation != nil) ||
		strings.Contains(lower, "titik a") ||
		strings.Contains(lower, "titik b") ||
		strings.Contains(lower, "dari a ke b") ||
		strings.Contains(lower, "bottleneck") ||
		(strings.Contains(lower, "rute") && (strings.Contains(lower, "ke") || strings.Contains(lower, "dari")))

	if isODTrip {
		origin := model.ODLocation{Latitude: -6.2245, Longitude: 106.8401, Name: "Titik A (Tebet Barat)"}
		dest := model.ODLocation{Latitude: -6.2088, Longitude: 106.8456, Name: "Titik B (Manggarai)"}
		if req.OriginLocation != nil {
			origin = *req.OriginLocation
		}
		if req.DestinationLocation != nil {
			dest = *req.DestinationLocation
		}

		if onStatus != nil {
			onStatus("analyzing_od", fmt.Sprintf("Mengevaluasi bottleneck & simulasi komuter %s → %s...", origin.Name, dest.Name), 2, 3)
		}

		odRes, err := s.analysisService.AnalyzeODTrip(ctx, origin, dest, userID)
		if err == nil {
			if onStatus != nil {
				onStatus("synthesizing", "Merangkum analisis bottleneck & komparasi As-Is vs To-Be...", 3, 3)
			}
			streamTextChunks(ctx, odRes.AINarrative, onDelta)
			return &model.ChatResponse{
				Message:         odRes.AINarrative,
				TriggeredODTrip: odRes,
				ToolExecuted:    "analyze_od_trip",
				SuggestedQuestions: []string{
					"Simulasikan halte rekomendasi di AI Urban Council",
					"Bagaimana mitigasi banjir di rute perjalanan ini?",
					"Buatkan Policy Brief untuk halte baru ini",
				},
			}, nil
		} else {
			msg := fmt.Sprintf("### 🗺️ Analisis Bottleneck Rute Komuter\n\n"+
				"Untuk mengevaluasi bottleneck perjalanan komuter dan solusinya, silakan tentukan **Titik Asal (A)** dan **Titik Tujuan (B)** pada peta:\n\n"+
				"1. **Set Titik A**: Klik titik awal di peta, lalu tekan tombol **`Set Titik A`**.\n"+
				"2. **Set Titik B**: Klik titik tujuan akhir di peta, lalu tekan tombol **`Set Titik B`**.\n"+
				"3. Atau sebutkan nama lokasi asal dan tujuan langsung di chat (misal: *'Analisis rute dari Tebet ke Manggarai'*).\n\n"+
				"Sistem LokaMaya akan secara otomatis menghitung *pedestrian gap*, transfer transit, dan mengusulkan titik halte optimal.")
			streamTextChunks(ctx, msg, onDelta)
			return &model.ChatResponse{
				Message:      msg,
				ToolExecuted: "analyze_od_trip",
				SuggestedQuestions: []string{
					"Analisis rute Tebet Barat ke Manggarai",
					"Analisis rute Kuningan ke Kelapa Gading",
				},
			}, nil
		}
	}

	// 0b. Cek apakah pengguna menanyakan layer UMKM / kepadatan UMKM
	isUMKM := strings.Contains(lower, "umkm") ||
		strings.Contains(lower, "usaha mikro") ||
		strings.Contains(lower, "pedagang") ||
		strings.Contains(lower, "warung") ||
		(strings.Contains(lower, "layer") && strings.Contains(lower, "kepadatan"))

	if isUMKM {
		lat := -6.2146
		lng := 106.8273
		if req.ContextLocation != nil {
			lat = req.ContextLocation.Latitude
			lng = req.ContextLocation.Longitude
		}

		simReq := &model.SimulateRequest{
			Latitude:     lat,
			Longitude:    lng,
			ScenarioType: "tambah",
			StopName:     "Area UMKM Sekitar",
		}
		simRes, _ := s.analysisService.RunSimulation(ctx, simReq, userID)

		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("### 🏪 Analisis Kepadatan & Potensi Ekonomi UMKM di Sekitar Lokasi (%.4f, %.4f)\n\n", lat, lng))
		if simRes != nil {
			sb.WriteString(fmt.Sprintf("- **Skor Potensi UMKM**: **%d/100** (Kategori: %s)\n", simRes.UMKMEconomic.Score, simRes.UMKMEconomic.Category))
			sb.WriteString(fmt.Sprintf("- **Persebaran UMKM**: Terdata **%d transaksi Struk Go** dan **%d pedagang informal** terpetakan di sekitar titik ini.\n", simRes.UMKMEconomic.StrukGoTransactions, simRes.UMKMEconomic.InformalVendorCount))
		}
		sb.WriteString("- **Aktivasi Layer Peta**: Layer spasial **UMKM (Struk/Menu Go)** telah diaktifkan di peta untuk memvisualisasikan sebaran pedagang lokal.\n")
		sb.WriteString("- **Rekomendasi Penataan Halte**: Penempatan halte TransJakarta di dekat koridor ini akan mempertemukan arus komuter dengan pelaku usaha mikro, meningkatkan omzet pedagang lokal hingga 25–40% sekaligus mencegah kesemrawutan trotoar melalui penyediaan zona drop-off yang tertata rapi.")

		msg := sb.String()
		if onStatus != nil {
			onStatus("synthesizing", "Menyiapkan data layer UMKM...", 3, 3)
		}
		streamTextChunks(ctx, msg, onDelta)
		return &model.ChatResponse{
			Message:             msg,
			ActiveLayerToggle:   "umkm",
			TriggeredSimulation: simRes,
			ToolExecuted:        "query_area_insight",
			SuggestedQuestions: []string{
				"Bagaimana dampak penataan halte terhadap pedagang lokal?",
				"Tampilkan layer rawan banjir di sekitar lokasi",
				"Simulasikan halte baru di titik ini",
			},
		}, nil
	}

	// 1. Cek apakah pengguna meminta rekomendasi / pencarian titik optimal ("sebaiknya di mana", "rekomendasi halte", dsb)
	isRecommendation := strings.Contains(lower, "sebaiknya") ||
		strings.Contains(lower, "rekomendasi") ||
		strings.Contains(lower, "di mana") ||
		strings.Contains(lower, "mana saja") ||
		strings.Contains(lower, "titik terbaik") ||
		strings.Contains(lower, "lokasi terbaik")

	if isRecommendation {
		lat := -6.2238
		lng := 106.8025
		corridor := "Wilayah Sekitar"
		if req.ContextLocation != nil {
			lat = req.ContextLocation.Latitude
			lng = req.ContextLocation.Longitude
			if req.ContextLocation.StopName != "" {
				corridor = req.ContextLocation.StopName
			}
		}

		if onStatus != nil {
			onStatus("optimizing", fmt.Sprintf("Mengevaluasi titik Pareto-optimal di %s...", corridor), 2, 3)
		}

		optRes, err := s.analysisService.FindOptimalStops(ctx, corridor, lat, lng, userID)
		if err == nil && len(optRes.TopCandidates) > 0 {
			var sb strings.Builder
			sb.WriteString(fmt.Sprintf("Berdasarkan analisis spasial komprehensif untuk **%s**, berikut 3 rekomendasi titik halte Pareto-optimal terbaik:\n\n", optRes.CorridorName))
			for _, c := range optRes.TopCandidates {
				sb.WriteString(fmt.Sprintf("#### %d. %s\n", c.Rank, c.Title))
				sb.WriteString(fmt.Sprintf("- **Nama / Titik**: %s (%.4f, %.4f)\n", c.SimulationResult.StopName, c.Latitude, c.Longitude))
				sb.WriteString(fmt.Sprintf("- **Skor Spasial**: Akses Pejalan Kaki **%d/100** | Potensi UMKM **%d/100**\n",
					c.SimulationResult.WalkAccessibility.Score,
					c.SimulationResult.UMKMEconomic.Score))
				sb.WriteString(fmt.Sprintf("- **Tata Ruang & Banjir**: Zonasi %s (**%s**) | Risiko Genangan **%s**\n",
					c.SimulationResult.SiteFeasibility.ZoneName,
					c.SimulationResult.SiteFeasibility.Status,
					c.SimulationResult.SiteFeasibility.FloodRisk))
				sb.WriteString(fmt.Sprintf("- **Alasan Rekomendasi**: %s\n\n", c.Reason))
			}
			msg := sb.String()
			if onStatus != nil {
				onStatus("synthesizing", "Merangkum rekomendasi halte terbaik...", 3, 3)
			}
			streamTextChunks(ctx, msg, onDelta)
			return &model.ChatResponse{
				Message:             msg,
				TriggeredSimulation: &optRes.TopCandidates[0].SimulationResult,
				ToolExecuted:        "find_optimal_stops",
				SuggestedQuestions: []string{
					"Pilih Kandidat 1 dan simulasikan",
					"Bahas kandidat ini di AI Urban Council",
					"Buatkan Policy Brief resmi",
				},
			}, nil
		}
	}

	// 2. Hanya jalankan simulasi jika ada instruksi simulasi eksplisit dari pengguna
	isExplicitSimulate := strings.Contains(lower, "simulasi") ||
		strings.Contains(lower, "simulasikan") ||
		strings.Contains(lower, "jalankan simulasi") ||
		strings.Contains(lower, "hitung skor") ||
		(strings.Contains(lower, "halte") && (strings.Contains(lower, "tambah") || strings.Contains(lower, "pindah") || strings.Contains(lower, "geser") || strings.Contains(lower, "tutup")))

	if isExplicitSimulate {
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
		if strings.Contains(lower, "pindah") || strings.Contains(lower, "geser") {
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

		msg := fmt.Sprintf(
			"Saya telah menjalankan simulasi spasial untuk **%s** (%s):\n\n- **Akses Jalan Kaki**: %d/100 (Est. %d jiwa dalam 5 menit)\n- **Ekonomi UMKM**: %d/100 (%d transaksi Struk Go & %d PKL Menu Go)\n- **Kelayakan Lokasi**: %s (Zonasi: %s, Risiko Banjir: %s)\n\n%s",
			simRes.StopName, simRes.ScenarioType,
			simRes.WalkAccessibility.Score, simRes.WalkAccessibility.EstimatedReach5Min,
			simRes.UMKMEconomic.Score, simRes.UMKMEconomic.StrukGoTransactions, simRes.UMKMEconomic.InformalVendorCount,
			simRes.SiteFeasibility.Status, simRes.SiteFeasibility.ZoneName, simRes.SiteFeasibility.FloodRisk,
			simRes.AINarrative,
		)
		if onStatus != nil {
			onStatus("synthesizing", "Merangkum hasil simulasi...", 3, 3)
		}
		streamTextChunks(ctx, msg, onDelta)

		return &model.ChatResponse{
			Message:             msg,
			TriggeredSimulation: simRes,
			ToolExecuted:        "simulate_stop",
			SuggestedQuestions: []string{
				"Lihat rincian komponen skor",
				"Bandingkan dengan halte alternatif",
				"Unduh ringkasan simulasi (PDF)",
			},
		}, nil
	}

	// Jika pengguna menyertakan pin lokasi tetapi bertanya pertanyaan umum / konsultasi
	if req.ContextLocation != nil {
		msg := fmt.Sprintf(
			"Halo! Anda sedang menandai lokasi **%s** (%.5f, %.5f). Ada yang bisa saya bantu terkait lokasi ini? Anda dapat menanyakan aksesibilitas pejalan kaki, regulasi zonasi RDTR, kepadatan UMKM di sekitar, atau ketik *'Simulasikan halte di sini'* untuk menguji dampak spasial pembukaan halte baru.",
			req.ContextLocation.StopName, req.ContextLocation.Latitude, req.ContextLocation.Longitude,
		)
		if onStatus != nil {
			onStatus("synthesizing", "Menyiapkan panduan konteks pin...", 3, 3)
		}
		streamTextChunks(ctx, msg, onDelta)
		return &model.ChatResponse{
			Message: msg,
			SuggestedQuestions: []string{
				fmt.Sprintf("Simulasikan penambahan halte di %s", req.ContextLocation.StopName),
				"Bagaimana kondisi aksesibilitas pejalan kaki di titik ini?",
				"Apa status zonasi tata ruang (RDTR) di lokasi ini?",
			},
		}, nil
	}

	generalMsg := "Halo! Saya LokaMaya AI Assistant. Anda dapat mengklik titik manapun di peta untuk memeriksa jangkauan jalan kaki 5-10 menit, atau tanyakan skenario transit seperti: *'Bagaimana dampaknya jika halte Senayan dipindah 300m ke utara?'*"
	if onStatus != nil {
		onStatus("synthesizing", "Menyiapkan panduan...", 3, 3)
	}
	streamTextChunks(ctx, generalMsg, onDelta)
	return &model.ChatResponse{
		Message: generalMsg,
		SuggestedQuestions: []string{
			"Simulasikan penambahan halte di Benhil",
			"Bagaimana cara membaca skor kelayakan lokasi?",
			"Apa saja dataset yang digunakan LokaMaya?",
		},
	}, nil
}
