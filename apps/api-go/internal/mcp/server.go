package mcp

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"lokamaya/api-go/internal/model"
	"lokamaya/api-go/internal/repository"
	"lokamaya/api-go/internal/service"
)

// JSONRPCRequest merepresentasikan request protokol JSON-RPC 2.0.
type JSONRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

// JSONRPCResponse merepresentasikan respons protokol JSON-RPC 2.0.
type JSONRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Result  interface{} `json:"result,omitempty"`
	Error   *RPCError   `json:"error,omitempty"`
}

type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Server adalah implementasi Model Context Protocol (MCP) Server untuk LokaMaya.
type Server struct {
	analysisSvc *service.AnalysisService
	chatSvc     *service.ChatService
	spatialRepo *repository.SpatialRepository
	sessions    sync.Map // sessionId -> chan []byte
}

func NewServer(
	analysisSvc *service.AnalysisService,
	chatSvc *service.ChatService,
	spatialRepo *repository.SpatialRepository,
) *Server {
	return &Server{
		analysisSvc: analysisSvc,
		chatSvc:     chatSvc,
		spatialRepo: spatialRepo,
	}
}

func generateSessionID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%x", b)
}

// HandleSSE menangani handshake SSE (Server-Sent Events) untuk MCP Transport.
// GET /mcp/sse
func (s *Server) HandleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	sessionID := generateSessionID()
	msgChan := make(chan []byte, 32)
	s.sessions.Store(sessionID, msgChan)
	defer s.sessions.Delete(sessionID)

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Kirim event 'endpoint' sesuai spesifikasi Anthropic MCP SSE transport
	endpointURI := fmt.Sprintf("/mcp/messages?sessionId=%s", sessionID)
	fmt.Fprintf(w, "event: endpoint\ndata: %s\n\n", endpointURI)
	flusher.Flush()

	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case msg := <-msgChan:
			fmt.Fprintf(w, "event: message\ndata: %s\n\n", string(msg))
			flusher.Flush()
		case <-ticker.C:
			// Heartbeat comment agar koneksi proxy/reverse-proxy tidak putus
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		}
	}
}

// HandleMessages menangani RPC message dari client MCP.
// POST /mcp/messages?sessionId=...
func (s *Server) HandleMessages(w http.ResponseWriter, r *http.Request) {
	var rpcReq JSONRPCRequest
	if err := json.NewDecoder(r.Body).Decode(&rpcReq); err != nil {
		s.writeRPCError(w, nil, -32700, "Parse error: request bukan JSON valid")
		return
	}

	ctx := r.Context()
	var result interface{}
	var rpcErr *RPCError

	switch rpcReq.Method {
	case "initialize":
		result = map[string]interface{}{
			"protocolVersion": "2024-11-05",
			"serverInfo": map[string]string{
				"name":    "lokamaya-spatial-mcp",
				"version": "2.1.0",
			},
			"capabilities": map[string]interface{}{
				"tools": map[string]bool{
					"listChanged": false,
				},
				"resources": map[string]bool{
					"subscribe":   false,
					"listChanged": false,
				},
			},
		}

	case "notifications/initialized":
		// No-op notification dari client
		w.WriteHeader(http.StatusAccepted)
		return

	case "tools/list":
		result = map[string]interface{}{
			"tools": s.getToolDefinitions(),
		}

	case "tools/call":
		res, err := s.callTool(ctx, rpcReq.Params)
		if err != nil {
			rpcErr = &RPCError{Code: -32603, Message: err.Error()}
		} else {
			result = res
		}

	case "resources/list":
		result = map[string]interface{}{
			"resources": []map[string]interface{}{
				{
					"uri":         "lokamaya://layers/stops",
					"name":        "Halte TransJakarta Eksisting",
					"mimeType":    "application/json",
					"description": "GeoJSON titik halte aktif TransJakarta se-DKI Jakarta",
				},
				{
					"uri":         "lokamaya://layers/routes",
					"name":        "Rute Koridor TransJakarta",
					"mimeType":    "application/json",
					"description": "GeoJSON multi-line jalur koridor TransJakarta",
				},
				{
					"uri":         "lokamaya://surveys/all",
					"name":        "Catatan Survei Lapangan Tim LokaMaya",
					"mimeType":    "application/json",
					"description": "19 titik hasil observasi lapangan lengkap dengan pain points pedestrian",
				},
			},
		}

	case "resources/read":
		res, err := s.readResource(ctx, rpcReq.Params)
		if err != nil {
			rpcErr = &RPCError{Code: -32602, Message: err.Error()}
		} else {
			result = res
		}

	default:
		rpcErr = &RPCError{Code: -32601, Message: fmt.Sprintf("Metode '%s' tidak ditemukan", rpcReq.Method)}
	}

	sessionID := r.URL.Query().Get("sessionId")
	respObj := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      rpcReq.ID,
		Result:  result,
		Error:   rpcErr,
	}

	// Jika client terhubung via SSE, broadcast ke channel sesi
	if sessionID != "" {
		if chVal, ok := s.sessions.Load(sessionID); ok {
			ch := chVal.(chan []byte)
			b, _ := json.Marshal(respObj)
			select {
			case ch <- b:
				w.WriteHeader(http.StatusAccepted)
				return
			default:
			}
		}
	}

	// Standar JSON HTTP POST response
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(respObj)
}

func (s *Server) writeRPCError(w http.ResponseWriter, id interface{}, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error:   &RPCError{Code: code, Message: message},
	})
}

// getToolDefinitions mendefinisikan 6 tools resmi MCP LokaMaya.
func (s *Server) getToolDefinitions() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"name":        "simulate_stop",
			"description": "Jalankan simulasi deterministik perubahan halte TransJakarta (tambah, pindah, tutup) dengan perhitungan skor Akses Jalan Kaki (OSRM), Ekonomi UMKM, dan Kelayakan RDTR.",
			"inputSchema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"latitude":      map[string]interface{}{"type": "number", "description": "Latitude lokasi halte"},
					"longitude":     map[string]interface{}{"type": "number", "description": "Longitude lokasi halte"},
					"scenario_type": map[string]interface{}{"type": "string", "enum": []string{"tambah", "pindah", "tutup"}},
					"stop_name":     map[string]interface{}{"type": "string", "description": "Nama halte"},
				},
				"required": []string{"latitude", "longitude", "scenario_type"},
			},
		},
		{
			"name":        "deliberate_stakeholders",
			"description": "Simulasikan musyawarah AI Urban Council 3 pemangku kepentingan (Rina - Warga, Siti - UMKM, Andi - Dishub) untuk mengukur tingkat konsensus sosial dan solusi kompromi.",
			"inputSchema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"latitude":      map[string]interface{}{"type": "number"},
					"longitude":     map[string]interface{}{"type": "number"},
					"scenario_type": map[string]interface{}{"type": "string", "enum": []string{"tambah", "pindah", "tutup"}},
					"stop_name":     map[string]interface{}{"type": "string"},
				},
				"required": []string{"latitude", "longitude", "scenario_type"},
			},
		},
		{
			"name":        "find_optimal_stops",
			"description": "Pencarian otonom 3 titik halte Pareto-optimal terbaik di sepanjang koridor (Pilihan Warga, Pilihan UMKM, dan Pilihan Resilien Bebas Banjir).",
			"inputSchema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"corridor_name":    map[string]interface{}{"type": "string", "description": "Nama koridor (misal: Jl. Gatot Subroto, Sudirman, Daan Mogot)"},
					"center_latitude":  map[string]interface{}{"type": "number"},
					"center_longitude": map[string]interface{}{"type": "number"},
				},
				"required": []string{"corridor_name"},
			},
		},
		{
			"name":        "query_area_insight",
			"description": "Ambil wawasan kualitatif dan catatan lapangan Survey Activities pada radius koordinat tertentu.",
			"inputSchema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"latitude":  map[string]interface{}{"type": "number"},
					"longitude": map[string]interface{}{"type": "number"},
				},
				"required": []string{"latitude", "longitude"},
			},
		},
		{
			"name":        "explain_score",
			"description": "Jelaskan metodologi dan rincian bobot perhitungan skor spasial LokaMaya.",
			"inputSchema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"score_type": map[string]interface{}{"type": "string", "enum": []string{"akses_jalan_kaki", "ekonomi_umkm", "kelayakan_lokasi", "konektivitas_rute"}},
				},
				"required": []string{"score_type"},
			},
		},
		{
			"name":        "generate_policy_brief",
			"description": "Susun dokumen naskah kebijakan formal (Policy Brief) berisi dasar hukum RDTR, evaluasi dampak, dan rekomendasi mitigasi siap cetak.",
			"inputSchema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"latitude":      map[string]interface{}{"type": "number"},
					"longitude":     map[string]interface{}{"type": "number"},
					"scenario_type": map[string]interface{}{"type": "string"},
					"stop_name":     map[string]interface{}{"type": "string"},
				},
				"required": []string{"latitude", "longitude", "scenario_type"},
			},
		},
	}
}

// callTool mengeksekusi pemanggilan tool sesuai spesifikasi MCP.
func (s *Server) callTool(ctx context.Context, params json.RawMessage) (map[string]interface{}, error) {
	var callParams struct {
		Name      string                 `json:"name"`
		Arguments map[string]interface{} `json:"arguments"`
	}
	if err := json.Unmarshal(params, &callParams); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}

	getFloat := func(m map[string]interface{}, key string) float64 {
		if v, ok := m[key]; ok {
			if f, ok := v.(float64); ok {
				return f
			}
		}
		return 0
	}
	getString := func(m map[string]interface{}, key string) string {
		if v, ok := m[key]; ok {
			if str, ok := v.(string); ok {
				return str
			}
		}
		return ""
	}

	switch callParams.Name {
	case "simulate_stop":
		simReq := &model.SimulateRequest{
			Latitude:     getFloat(callParams.Arguments, "latitude"),
			Longitude:    getFloat(callParams.Arguments, "longitude"),
			ScenarioType: getString(callParams.Arguments, "scenario_type"),
			StopName:     getString(callParams.Arguments, "stop_name"),
		}
		res, err := s.analysisSvc.RunSimulation(ctx, simReq, nil)
		if err != nil {
			return nil, err
		}
		b, _ := json.Marshal(res)
		return map[string]interface{}{
			"content": []map[string]string{
				{"type": "text", "text": string(b)},
			},
		}, nil

	case "deliberate_stakeholders":
		simReq := &model.SimulateRequest{
			Latitude:     getFloat(callParams.Arguments, "latitude"),
			Longitude:    getFloat(callParams.Arguments, "longitude"),
			ScenarioType: getString(callParams.Arguments, "scenario_type"),
			StopName:     getString(callParams.Arguments, "stop_name"),
		}
		res, err := s.analysisSvc.RunSimulation(ctx, simReq, nil)
		if err != nil {
			return nil, err
		}
		delib, err := s.analysisSvc.DeliberateStakeholders(ctx, res)
		if err != nil {
			return nil, err
		}
		b, _ := json.Marshal(delib)
		return map[string]interface{}{
			"content": []map[string]string{
				{"type": "text", "text": string(b)},
			},
		}, nil

	case "find_optimal_stops":
		corridor := getString(callParams.Arguments, "corridor_name")
		cLat := getFloat(callParams.Arguments, "center_latitude")
		cLng := getFloat(callParams.Arguments, "center_longitude")
		res, err := s.analysisSvc.FindOptimalStops(ctx, corridor, cLat, cLng, nil)
		if err != nil {
			return nil, err
		}
		b, _ := json.Marshal(res)
		return map[string]interface{}{
			"content": []map[string]string{
				{"type": "text", "text": string(b)},
			},
		}, nil

	case "query_area_insight":
		lat := getFloat(callParams.Arguments, "latitude")
		lng := getFloat(callParams.Arguments, "longitude")
		survey, _ := s.spatialRepo.FindNearestSurveyActivity(ctx, lat, lng, 1200.0)
		b, _ := json.Marshal(survey)
		return map[string]interface{}{
			"content": []map[string]string{
				{"type": "text", "text": string(b)},
			},
		}, nil

	case "explain_score":
		scoreType := getString(callParams.Arguments, "score_type")
		explanation := map[string]string{
			"akses_jalan_kaki":  "Skor 0-100 dihitung dari persimpangan poligon jangkauan jalan kaki OSRM (5 & 10 menit) dengan blok kepadatan penduduk Jakarta Satu.",
			"ekonomi_umkm":      "Skor 0-100 menggabungkan agregasi transaksi lokal Struk Go dan rasio keberadaan pedagang informal/kaki lima Menu Go dalam radius 300-500m.",
			"kelayakan_lokasi":  "Evaluasi peruntukan lahan berdasarkan zonasi RDTR 2022 (Sesuai/Bersyarat/Tidak Sesuai) dan tumpang susun zona rawan banjir InaRISK BPBD DKI.",
			"konektivitas_rute": "Analisis dampak perubahan halte terhadap rute aktif TransJakarta untuk mendeteksi potensi rute terputus.",
		}
		return map[string]interface{}{
			"content": []map[string]string{
				{"type": "text", "text": explanation[scoreType]},
			},
		}, nil

	case "generate_policy_brief":
		simReq := &model.SimulateRequest{
			Latitude:     getFloat(callParams.Arguments, "latitude"),
			Longitude:    getFloat(callParams.Arguments, "longitude"),
			ScenarioType: getString(callParams.Arguments, "scenario_type"),
			StopName:     getString(callParams.Arguments, "stop_name"),
		}
		res, err := s.analysisSvc.RunSimulation(ctx, simReq, nil)
		if err != nil {
			return nil, err
		}
		brief, err := s.analysisSvc.GeneratePolicyBrief(ctx, res)
		if err != nil {
			return nil, err
		}
		return map[string]interface{}{
			"content": []map[string]string{
				{"type": "text", "text": brief},
			},
		}, nil

	default:
		return nil, fmt.Errorf("tool '%s' tidak didukung", callParams.Name)
	}
}

// readResource mengambil konten resource URI sesuai spesifikasi MCP.
func (s *Server) readResource(ctx context.Context, params json.RawMessage) (map[string]interface{}, error) {
	var readParams struct {
		URI string `json:"uri"`
	}
	if err := json.Unmarshal(params, &readParams); err != nil {
		return nil, err
	}

	switch readParams.URI {
	case "lokamaya://layers/stops":
		features, err := s.spatialRepo.GetLayerFeatures(ctx, "transjakarta_stops")
		if err != nil {
			return nil, err
		}
		b, _ := json.Marshal(features)
		return map[string]interface{}{
			"contents": []map[string]string{
				{"uri": readParams.URI, "mimeType": "application/json", "text": string(b)},
			},
		}, nil

	case "lokamaya://layers/routes":
		features, err := s.spatialRepo.GetLayerFeatures(ctx, "transjakarta_routes")
		if err != nil {
			return nil, err
		}
		b, _ := json.Marshal(features)
		return map[string]interface{}{
			"contents": []map[string]string{
				{"uri": readParams.URI, "mimeType": "application/json", "text": string(b)},
			},
		}, nil

	default:
		return nil, fmt.Errorf("resource URI '%s' tidak ditemukan", readParams.URI)
	}
}
