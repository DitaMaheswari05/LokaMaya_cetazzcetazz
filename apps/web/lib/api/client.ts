import {
  SimulateRequest,
  SimulationResult,
  CompareRequest,
  CompareResult,
  ChatRequest,
  ChatResponse,
  LayerConfig,
  DeliberationResult,
  OptimalSearchResponse,
  ODLocation,
  ODTripAnalysisResult,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Kirim cookie auth HttpOnly secara otomatis
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Terjadi kesalahan jaringan' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Menjalankan simulasi skenario perubahan halte (tambah, pindah, tutup).
   */
  async simulateStop(params: SimulateRequest): Promise<SimulationResult> {
    return this.request<SimulationResult>('/api/v1/analysis/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Membandingkan dua skenario perubahan halte secara side-by-side.
   */
  async compareScenarios(params: CompareRequest): Promise<CompareResult> {
    return this.request<CompareResult>('/api/v1/analysis/compare', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Mengirim pesan ke AI Chatbot Assistant dengan dukungan pin koordinat & context chip.
   */
  async sendChatMessage(params: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Mengirim pesan ke AI Chatbot Assistant dengan real-time Server-Sent Events (SSE) streaming.
   */
  async streamChatMessage(
    params: ChatRequest,
    callbacks: {
      onStatus?: (status: { stage: string; message: string; step: number; total_steps: number }) => void;
      onDelta?: (delta: string) => void;
      onComplete?: (response: ChatResponse) => void;
      onError?: (error: Error) => void;
    },
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${API_BASE_URL}/api/v1/chat/stream`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Terjadi kesalahan jaringan' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream tidak didukung oleh browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace('event:', '').trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'status' && callbacks.onStatus) {
                callbacks.onStatus(data);
              } else if (currentEvent === 'delta' && callbacks.onDelta) {
                callbacks.onDelta(data.text || '');
              } else if (currentEvent === 'complete' && callbacks.onComplete) {
                callbacks.onComplete(data);
              } else if (currentEvent === 'error') {
                throw new Error(data.error || 'Terjadi kesalahan server');
              }
            } catch (err: any) {
              if (currentEvent === 'error') throw err;
            }
          }
        }
      }
    } catch (err: any) {
      if (signal?.aborted) {
        return;
      }
      if (callbacks.onError) {
        callbacks.onError(err);
      } else {
        throw err;
      }
    }
  }

  /**
   * Mengambil konfigurasi daftar layer peta yang tersedia.
   */
  async getMapLayers(): Promise<{ layers: LayerConfig[] }> {
    return this.request<{ layers: LayerConfig[] }>('/api/v1/map/layers', {
      method: 'GET',
    });
  }

  /**
   * Mengambil fitur spasial GeoJSON untuk layer tertentu (halte, rute, rdtr, banjir, umkm, community).
   */
  async getLayerFeatures(layerId: string): Promise<any> {
    return this.request<any>(`/api/v1/map/features?layer=${encodeURIComponent(layerId)}`, {
      method: 'GET',
    });
  }

  /**
   * Mengambil poligon jangkauan jalan kaki 5 dan 10 menit (isochrone).
   */
  async getIsochrone(latitude: number, longitude: number): Promise<any> {
    return this.request<any>(`/api/v1/routing/isochrone?lat=${latitude}&lng=${longitude}`, {
      method: 'GET',
    });
  }

  /**
   * Menjalankan musyawarah multi-agent AI Urban Council (Rina, Siti, Andi).
   */
  async deliberateStakeholders(params: SimulateRequest): Promise<DeliberationResult> {
    return this.request<DeliberationResult>('/api/v1/analysis/deliberate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Mencari titik halte Pareto-optimal secara otonom di sepanjang koridor.
   */
  async findOptimalStops(corridorName: string, centerLat?: number, centerLng?: number): Promise<OptimalSearchResponse> {
    return this.request<OptimalSearchResponse>('/api/v1/analysis/optimal', {
      method: 'POST',
      body: JSON.stringify({
        corridor_name: corridorName,
        center_latitude: centerLat || 0,
        center_longitude: centerLng || 0,
      }),
    });
  }

  /**
   * Menyusun naskah advokasi kebijakan formal (Policy Brief).
   */
  async generatePolicyBrief(params: SimulateRequest): Promise<{ simulation_id: string; stop_name: string; policy_brief: string }> {
    return this.request<{ simulation_id: string; stop_name: string; policy_brief: string }>('/api/v1/analysis/policy-brief', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Menganalisis perjalanan Titik A ke Titik B, keparahan bottleneck, usulan halte, dan simulasi As-Is vs To-Be.
   */
  async analyzeODTrip(origin: ODLocation, destination: ODLocation): Promise<ODTripAnalysisResult> {
    return this.request<ODTripAnalysisResult>('/api/v1/analysis/od-trip', {
      method: 'POST',
      body: JSON.stringify({ origin, destination }),
    });
  }
}

export const apiClient = new ApiClient();
