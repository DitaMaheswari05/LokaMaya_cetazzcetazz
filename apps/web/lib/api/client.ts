import {
  SimulateRequest,
  SimulationResult,
  CompareRequest,
  CompareResult,
  ChatRequest,
  ChatResponse,
  LayerConfig,
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
   * Mengambil konfigurasi daftar layer peta yang tersedia.
   */
  async getMapLayers(): Promise<{ layers: LayerConfig[] }> {
    return this.request<{ layers: LayerConfig[] }>('/api/v1/map/layers', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
