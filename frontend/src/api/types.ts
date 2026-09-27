export type UserRole = 'patient' | 'hospital_staff' | 'admin';

export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW';

export type AmbulanceRequestStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'DISPATCHED'
  | 'ARRIVING'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type BloodRequestStatus = 'OPEN' | 'MATCHING' | 'FULFILLED' | 'CLOSED';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: number;
  phone: string;
  name: string;
  role: UserRole;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id: number;
  name: string;
}

export interface PatientProfile {
  id: number;
  user_id: number;
  name: string;
  age?: number;
  gender?: string;
  phone: string;
  blood_group?: string;
  address?: string;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  services?: string;
}

export interface AppointmentSlot {
  id: number;
  hospital_id: number;
  service: string;
  slot_datetime: string;
  capacity: number;
  booked: number;
  is_available: boolean;
}

export interface Appointment {
  id: number;
  patient_id: number;
  hospital_id: number;
  service: string;
  slot_time: string;
  status: AppointmentStatus;
  source?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  hospital?: Hospital;
  patient?: { name: string; phone: string };
}

export interface AmbulanceRequest {
  id: number;
  patient_id: number;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address?: string;
  destination_hospital_id?: number;
  urgency: UrgencyLevel;
  status: AmbulanceRequestStatus;
  ambulance_id?: number;
  eta_minutes?: number;
  patient_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BloodResource {
  id: number;
  name: string;
  type: 'bank' | 'hospital';
  district?: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  last_verified?: string;
  source_url?: string;
  distance_km?: number;
}

export interface Donor {
  id: number;
  name?: string;
  blood_group: string;
  general_area?: string;
  consent_flag: boolean;
  distance_km?: number;
}

export interface BloodRequest {
  id: number;
  patient_id: number;
  patient_name?: string;
  blood_group: string;
  location?: string;
  units: number;
  urgency: UrgencyLevel;
  status: BloodRequestStatus;
  notes?: string;
  created_at?: string;
}

export interface GovernmentScheme {
  id: number;
  name: string;
  state: string;
  description?: string;
  eligibility?: string;
  documents?: string;
  official_website?: string;
  official_contact?: string;
  source?: string;
  last_verified?: string;
}

export interface NotificationItem {
  id: number;
  channel: 'in_app' | 'whatsapp' | 'voice';
  title?: string;
  message: string;
  read: boolean;
  created_at?: string;
}

export interface DocumentItem {
  id: number;
  type?: string;
  filename?: string;
  file_size_kb?: number;
  is_demo: boolean;
  created_at?: string;
}

export interface SystemStats {
  total_patients: number;
  total_hospitals: number;
  total_appointments: number;
  appointments_today: number;
  open_blood_requests: number;
  active_ambulance_requests: number;
  total_blood_banks: number;
  total_schemes: number;
}

export interface NoShowRisk {
  appointment_id: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  factors: string[];
  disclaimer: string;
}

export interface DemandForecast {
  hospital_id: number;
  service: string;
  forecast: 'LOW' | 'MEDIUM' | 'HIGH';
  disclaimer: string;
}

export interface ResourcePriority {
  resource_id: number;
  resource_name: string;
  score: number;
  distance_km: number;
  availability_factor: string;
  urgency_factor: string;
  disclaimer: string;
}

export interface AssistantMessageResponse {
  intent: string;
  response: string;
  action_taken?: string;
  is_simulated: boolean;
}
