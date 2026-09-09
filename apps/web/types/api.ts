// TypeScript types untuk integrasi API LokaMaya Frontend (Next.js) & Go Backend

export interface ContextLocation {
  latitude: number;
  longitude: number;
  stop_name?: string;
}

export interface ChatMessageItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  context_location?: ContextLocation;
  history?: ChatMessageItem[];
}

export interface WalkScoreDetail {
  score: number; // 0-100
  category: 'baik' | 'sedang' | 'perlu_perhatian';
  estimated_reach_5min: number;
  estimated_reach_10min: number;
  isochrone_geometry?: any;
}

export interface UMKMScoreDetail {
  score: number; // 0-100
  category: 'baik' | 'sedang' | 'perlu_perhatian';
  struk_go_transactions: number;
  informal_vendor_count: number;
  formal_business_count: number;
}

export interface FeasibilityDetail {
  status: 'Sesuai' | 'Bersyarat' | 'Tidak Sesuai';
  zone_code: string;
  zone_name: string;
  flood_risk: 'Rendah' | 'Sedang' | 'Tinggi';
  recommendation: string;
}

export interface RouteConnectivityDetail {
  connected_routes: string[];
  disrupted_routes: string[];
  total_affected: number;
}

export interface QualitativeContext {
  has_survey_data: boolean;
  nearest_survey_point?: string;
  distance_meters?: number;
  field_notes?: string;
  pain_points?: string;
  potentials?: string;
}

export interface SimulationResult {
  id: string;
  scenario_type: 'tambah' | 'pindah' | 'tutup';
  stop_name: string;
  latitude: number;
  longitude: number;
  walk_accessibility: WalkScoreDetail;
  umkm_economic: UMKMScoreDetail;
  site_feasibility: FeasibilityDetail;
  route_connectivity: RouteConnectivityDetail;
  qualitative_context: QualitativeContext;
  ai_narrative: string;
  created_at: string;
}

export interface SimulateRequest {
  latitude: number;
  longitude: number;
  scenario_type: 'tambah' | 'pindah' | 'tutup';
  stop_name?: string;
  target_stop_id?: string;
}

export interface CompareRequest {
  scenario_a: SimulateRequest;
  scenario_b: SimulateRequest;
}

export interface CompareResult {
  scenario_a: SimulationResult;
  scenario_b: SimulationResult;
  comparative_narrative: string;
  recommended_scenario: 'scenario_a' | 'scenario_b';
}

export interface ChatResponse {
  message: string;
  triggered_simulation?: SimulationResult;
  tool_executed?: string;
  suggested_questions?: string[];
}

export interface LayerConfig {
  id: string;
  name: string;
  group: 'transit' | 'zonasi' | 'demografi' | 'lingkungan' | 'survei';
  description: string;
  visible: boolean;
  opacity: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  layer?: string;
  features: GeoJSONFeature[];
}
