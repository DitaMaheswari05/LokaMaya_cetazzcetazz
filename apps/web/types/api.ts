// TypeScript types untuk integrasi API LokaMaya Frontend (Next.js) & Go Backend

export interface ContextLocation {
  latitude: number;
  longitude: number;
  stop_name?: string;
}

export interface ODLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface ODStopReference {
  id: string;
  name: string;
  distance_meters: number;
  walk_minutes: number;
  corridor: string;
  routes: string[];
  latitude: number;
  longitude: number;
  is_brt: boolean;
}

export interface BottleneckDetail {
  severity: 'Kritis' | 'Sedang' | 'Ringan' | string;
  friction_score: number;
  first_mile_gap_meters: number;
  last_mile_gap_meters: number;
  requires_transfer: boolean;
  transfer_count: number;
  flood_risk_detected: boolean;
  summary: string;
  key_issues: string[];
}

export interface ProposedStopRecommendation {
  action: 'tambah' | 'pindah' | string;
  stop_name: string;
  latitude: number;
  longitude: number;
  corridor: string;
  distance_to_origin_meters: number;
  distance_to_destination_meters: number;
  rationale: string;
  estimated_reach_population: number;
}

export interface JourneyStep {
  step_number: number;
  mode: 'walk' | 'bus' | 'transfer' | string;
  title: string;
  description: string;
  distance_meters: number;
  duration_minutes: number;
  icon?: string;
}

export interface JourneySimulation {
  total_duration_minutes: number;
  total_walk_distance_meters: number;
  total_transit_time_minutes: number;
  transit_rides_count: number;
  pedestrian_strain_level: string;
  comfort_rating: number;
  steps: JourneyStep[];
}

export interface ODTripAnalysisResult {
  origin: ODLocation;
  destination: ODLocation;
  direct_distance_meters: number;
  nearest_origin_stop: ODStopReference;
  nearest_destination_stop: ODStopReference;
  bottleneck: BottleneckDetail;
  proposed_stop: ProposedStopRecommendation;
  as_is_journey: JourneySimulation;
  to_be_journey: JourneySimulation;
  delta_travel_time_minutes: number;
  delta_walk_distance_meters: number;
  efficiency_gain_percent: number;
  ai_narrative: string;
  route_geojson?: any;
}

export interface ODTripRequest {
  origin: ODLocation;
  destination: ODLocation;
}

export interface ChatMessageItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  context_location?: ContextLocation;
  origin_location?: ODLocation;
  destination_location?: ODLocation;
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

export interface RouteStopItem {
  sequence: number;
  name: string;
  status: 'existing' | 'added' | 'removed' | 'relocated';
  is_simulated: boolean;
  latitude: number;
  longitude: number;
}

export interface RouteComparisonDetail {
  primary_route_code: string;
  primary_route_name: string;
  affected_corridor: string;
  direction: string;
  as_is_stops: RouteStopItem[];
  to_be_stops: RouteStopItem[];
  changed_segment: string;
  all_affected_routes: string[];
  delta_distance_meters: number;
  delta_travel_time_minutes: number;
  summary: string;
  as_is_geojson: any;
  to_be_geojson: any;
}

export interface QualitativeContext {
  has_survey_data: boolean;
  nearest_survey_point?: string;
  distance_meters?: number;
  field_notes?: string;
  pain_points?: string;
  potentials?: string;
}

export interface StakeholderOpinion {
  persona: string;
  role: string;
  stance: string;
  quote: string;
  key_reason: string;
}

export interface DeliberationResult {
  simulation_id: string;
  social_acceptance_rate: number;
  consensus_level: 'Tinggi' | 'Sedang' | 'Rendah' | string;
  stakeholders: StakeholderOpinion[];
  compromise_solution: string;
}

export interface BehavioralRippleDetail {
  modal_shift_ojol_percent: number;
  walk_commuter_impact: string;
  informal_vendor_turnover: string;
  summary: string;
}

export interface SimulationResult {
  id: string;
  scenario_type: 'tambah' | 'pindah' | 'tutup' | 'evaluasi';
  stop_name: string;
  latitude: number;
  longitude: number;
  walk_accessibility: WalkScoreDetail;
  umkm_economic: UMKMScoreDetail;
  site_feasibility: FeasibilityDetail;
  route_connectivity: RouteConnectivityDetail;
  route_comparison?: RouteComparisonDetail;
  deliberation?: DeliberationResult;
  behavioral_ripple?: BehavioralRippleDetail;
  policy_brief?: string;
  qualitative_context: QualitativeContext;
  ai_narrative: string;
  created_at: string;
}

export interface OptimalStopCandidate {
  rank: number;
  title: string;
  latitude: number;
  longitude: number;
  simulation_result: SimulationResult;
  reason: string;
}

export interface OptimalSearchResponse {
  corridor_name: string;
  total_sampled: number;
  top_candidates: OptimalStopCandidate[];
}

export interface SimulateRequest {
  latitude: number;
  longitude: number;
  scenario_type: 'tambah' | 'pindah' | 'tutup' | 'evaluasi';
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
  triggered_od_trip?: ODTripAnalysisResult;
  active_layer_toggle?: string;
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
