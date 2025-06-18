export interface PilotProfile {
  id: string;
  certificate_number?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  license_type: 'ATP' | 'Commercial' | 'Private' | 'Student';
  medical_expiry?: string; // ISO date string
  flight_review_expiry?: string; // ISO date string
  total_hours: number;
  pic_hours: number;
  instrument_hours: number;
  is_active: boolean;
  role: 'pilot' | 'captain' | 'first_officer' | 'dispatcher' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Aircraft {
  id: string;
  tail_number: string;
  model?: string;
  manufacturer?: string;
  year_manufactured?: number;
  max_passengers?: number;
  max_range_nm?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Flight {
  id: string;
  aircraft_id: string;
  captain_id?: string;
  first_officer_id?: string;
  dispatcher_id?: string;
  departure_time: string; // ISO string for timestamptz
  arrival_time: string; // ISO string for timestamptz
  origin: string;
  destination: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  flight_type: 'charter' | 'positioning' | 'training' | 'maintenance';
  passenger_count: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FlightWithDetails extends Flight {
  aircraft: Aircraft;
  captain?: PilotProfile;
  first_officer?: PilotProfile;
  dispatcher?: PilotProfile;
  created_by_pilot?: PilotProfile;
}

export interface FlightCrew {
  id: string;
  flight_id: string;
  pilot_id: string;
  role: 'captain' | 'first_officer' | 'flight_attendant' | 'mechanic';
  created_at: string;
}

export interface NewFlight {
  aircraft_id: string;
  captain_id?: string;
  first_officer_id?: string;
  departure_time: string;
  arrival_time: string;
  origin: string;
  destination: string;
  flight_type?: 'charter' | 'positioning' | 'training' | 'maintenance';
  passenger_count?: number;
  notes?: string;
}

export interface PilotProfileUpdate {
  certificate_number?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  license_type?: 'ATP' | 'Commercial' | 'Private' | 'Student';
  medical_expiry?: string;
  flight_review_expiry?: string;
  total_hours?: number;
  pic_hours?: number;
  instrument_hours?: number;
}

// Legacy types for backward compatibility
export type FlightWithAircraft = FlightWithDetails

// Document types
export interface DocMeta {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  entity_type: 'pilot' | 'aircraft' | 'general';
  entity_id?: string;
  doc_type: 'medical_certificate' | 'pilot_license' | 'flight_review' | 'insurance' |
           'airworthiness' | 'registration' | 'weight_balance' | 'maintenance_log' |
           'ops_manual' | 'emergency_procedures' | 'checklist' | 'other';
  expiry_date?: string; // ISO date string
  is_critical: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocAccessLog {
  id: string;
  doc_id: string;
  accessed_by: string;
  action: 'upload' | 'download' | 'view' | 'delete';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface DocUpload {
  file: File;
  entity_type: 'pilot' | 'aircraft' | 'general';
  entity_id?: string;
  doc_type: DocMeta['doc_type'];
  expiry_date?: string;
  is_critical?: boolean;
}

export interface DocComplianceStatus {
  entity_id: string;
  entity_type: 'pilot' | 'aircraft';
  entity_name: string; // pilot name or aircraft tail number
  total_docs: number;
  expired_docs: number;
  expiring_soon_docs: number; // within 30 days
  critical_expired: number;
  overall_status: 'compliant' | 'warning' | 'non_compliant';
  docs: DocMeta[];
}

export interface DocFilterOptions {
  entity_type?: 'pilot' | 'aircraft' | 'general';
  entity_id?: string;
  doc_type?: DocMeta['doc_type'];
  expiry_status?: 'all' | 'expired' | 'expiring_soon' | 'valid';
  is_critical?: boolean;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  pilot_profile?: PilotProfile;
}

// Fuel Tracking Types
export interface FuelEvent {
  id: string;
  flight_id?: string;
  aircraft_id: string;
  event_type: 'uplift' | 'burn_actual' | 'burn_planned';
  fuel_quantity: number; // gallons
  price_per_gallon?: number; // for uplift events
  total_cost?: number; // auto-calculated for uplift events
  location?: string; // airport code or fuel station
  supplier?: string; // fuel supplier name
  distance_nm?: number; // nautical miles
  flight_time_hours?: number; // flight hours
  event_date: string; // ISO date string
  recorded_by: string; // pilot profile id
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelEventCreate {
  flight_id?: string;
  aircraft_id: string;
  event_type: 'uplift' | 'burn_actual' | 'burn_planned';
  fuel_quantity: number;
  price_per_gallon?: number;
  total_cost?: number; // auto-calculated for uplift events
  location?: string;
  supplier?: string;
  distance_nm?: number;
  flight_time_hours?: number;
  event_date?: string;
  notes?: string;
}

export interface FuelEfficiencySummary {
  aircraft_id: string;
  tail_number: string;
  model: string;
  actual_burn_events: number;
  avg_fuel_burn_gal: number;
  avg_gal_per_nm: number;
  avg_gal_per_hour: number;
  uplift_events: number;
  total_fuel_purchased_gal: number;
  total_fuel_cost: number;
  avg_price_per_gallon: number;
  avg_cost_per_nm: number;
  avg_burn_variance_percent: number;
  first_event_date: string;
  last_event_date: string;
}

export interface FlightFuelSummary {
  flight_id: string;
  aircraft_id: string;
  tail_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  flight_hours: number;
  fuel_uplift_gal?: number;
  price_per_gallon?: number;
  fuel_cost?: number;
  fuel_location?: string;
  fuel_supplier?: string;
  planned_burn_gal?: number;
  actual_burn_gal?: number;
  actual_gal_per_nm?: number;
  actual_gal_per_hour?: number;
  cost_per_nm?: number;
  burn_variance_percent?: number;
  fuel_status: 'missing_actual' | 'missing_planned' | 'high_variance' | 'normal';
}

export interface FuelFilterOptions {
  aircraft_id?: string;
  event_type?: 'uplift' | 'burn_actual' | 'burn_planned';
  date_from?: string;
  date_to?: string;
  location?: string;
  supplier?: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any | null;
  new_data: any | null;
  description?: string;
  performed_at: string; // ISO date string
  performed_by: string | null; // user id
  pilot_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AuditLogWithUser extends AuditLog {
  pilot_profile: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AuditLogFilters {
  action?: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name?: string;
  performed_by?: string;
  date_from?: string; // ISO date string
  date_to?: string; // ISO date string
} 