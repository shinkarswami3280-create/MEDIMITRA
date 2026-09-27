import {
  AuthResponse,
  User,
  Appointment,
  AppointmentSlot,
  AmbulanceRequest,
  BloodResource,
  BloodRequest,
  Donor,
  GovernmentScheme,
  NotificationItem,
  DocumentItem,
  SystemStats,
  NoShowRisk,
  DemandForecast,
  ResourcePriority,
  AssistantMessageResponse,
  Hospital,
} from './types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('medimitra_token');
}

export function setStoredAuth(token: string, user: { id: number; name: string; role: string }) {
  localStorage.setItem('medimitra_token', token);
  localStorage.setItem('medimitra_user', JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem('medimitra_token');
  localStorage.removeItem('medimitra_user');
}

export function getStoredUser(): { id: number; name: string; role: string } | null {
  const data = localStorage.getItem('medimitra_user');
  return data ? JSON.parse(data) : null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.detail || errMsg;
    } catch {
      // fallback
    }
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ───
export const api = {
  demoLogin: (role: 'patient' | 'hospital_staff' | 'admin') =>
    request<AuthResponse>(`/auth/demo-login/${role}`, { method: 'POST' }),

  login: (phone: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  register: (name: string, phone: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password }),
    }),

  getMe: () => request<User>('/auth/me'),

  // ─── Hospitals & Slots ───
  getHospitals: () => request<Hospital[]>('/hospitals'),
  getHospital: (id: number) => request<Hospital>(`/hospitals/${id}`),
  getSlots: (hospitalId: number, service?: string) => {
    const q = new URLSearchParams({ hospital_id: hospitalId.toString() });
    if (service) q.append('service', service);
    return request<AppointmentSlot[]>(`/appointments/slots?${q.toString()}`);
  },

  // ─── Appointments ───
  bookAppointment: (payload: { hospital_id: number; service: string; slot_id: number; notes?: string }) =>
    request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyAppointments: () => request<Appointment[]>('/appointments/my'),
  getHospitalAppointments: (hospitalId?: number) => {
    const q = hospitalId ? `?hospital_id=${hospitalId}` : '';
    return request<Appointment[]>(`/appointments/hospital${q}`);
  },
  cancelAppointment: (id: number) =>
    request<Appointment>(`/appointments/${id}/cancel`, { method: 'PUT' }),
  rescheduleAppointment: (id: number, newSlotId: number) =>
    request<Appointment>(`/appointments/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ new_slot_id: newSlotId }),
    }),
  updateAppointmentStatus: (id: number, status: string, notes?: string) =>
    request<Appointment>(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  // ─── Ambulance ───
  requestAmbulance: (payload: {
    pickup_lat: number;
    pickup_lng: number;
    pickup_address?: string;
    urgency: string;
    destination_hospital_id?: number;
    patient_contact?: string;
  }) =>
    request<AmbulanceRequest>('/ambulance/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyAmbulanceRequest: () =>
    request<AmbulanceRequest | null>('/ambulance/my-request'),

  getHospitalAmbulanceQueue: (hospitalId?: number) => {
    const q = hospitalId ? `?hospital_id=${hospitalId}` : '';
    return request<AmbulanceRequest[]>(`/ambulance/queue${q}`);
  },

  updateAmbulanceStatus: (id: number, status: string, eta_minutes?: number) =>
    request<AmbulanceRequest>(`/ambulance/request/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, eta_minutes }),
    }),

  // ─── Blood Coordination ───
  getBloodResources: (district?: string) => {
    const q = district ? `?district=${encodeURIComponent(district)}` : '';
    return request<BloodResource[]>(`/blood/resources${q}`);
  },

  createBloodRequest: (payload: {
    blood_group: string;
    location?: string;
    location_lat?: number;
    location_lng?: number;
    units: number;
    urgency: string;
    notes?: string;
  }) =>
    request<BloodRequest>('/blood/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyBloodRequests: () => request<BloodRequest[]>('/blood/my-requests'),
  getHospitalBloodInbox: () => request<BloodRequest[]>('/blood/inbox'),

  matchBlood: (bloodGroup: string, lat?: number, lng?: number) => {
    const q = new URLSearchParams({ blood_group: bloodGroup });
    if (lat !== undefined) q.append('user_lat', lat.toString());
    if (lng !== undefined) q.append('user_lng', lng.toString());
    return request<{ blood_resources: BloodResource[]; donors: Donor[]; factors_explanation: string }>(
      `/blood/match?${q.toString()}`
    );
  },

  requestDonorConsent: (bloodRequestId: number, donorId: number) =>
    request<{ ok: boolean; message: string }>('/blood/consent/request', {
      method: 'POST',
      body: JSON.stringify({ blood_request_id: bloodRequestId, donor_id: donorId }),
    }),

  // ─── Schemes & Assistance ───
  getSchemes: (state?: string) => {
    const q = state ? `?state=${encodeURIComponent(state)}` : '';
    return request<GovernmentScheme[]>(`/schemes${q}`);
  },
  updateScheme: (id: number, payload: Partial<GovernmentScheme>) =>
    request<GovernmentScheme>(`/schemes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getFinancialAssistance: () => request<any[]>('/schemes/financial-assistance'),

  // ─── Documents ───
  getMyDocuments: () => request<DocumentItem[]>('/documents'),

  // ─── Notifications ───
  getNotifications: (unreadOnly = false) =>
    request<NotificationItem[]>(`/notifications?unread_only=${unreadOnly}`),
  markNotificationRead: (id: number) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<{ ok: boolean }>('/notifications/mark-all-read', { method: 'PUT' }),

  // ─── Command Center & Export ───
  getCommandCenterFeed: (hospitalId?: number) => {
    const q = hospitalId ? `?hospital_id=${hospitalId}` : '';
    return request<any>(`/hospital/command-center${q}`);
  },

  downloadAppointmentsCSV: async (hospitalId: number) => {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE}/hospital/export/appointments/csv?hospital_id=${hospitalId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments_hospital_${hospitalId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  syncGoogleSheets: (hospitalId: number) =>
    request<{ success: boolean; message: string }>(`/hospital/export/sync-sheets?hospital_id=${hospitalId}`, {
      method: 'POST',
    }),

  // ─── Admin ───
  getSystemStats: () => request<SystemStats>('/admin/stats'),
  getAuditLogs: (limit = 30) => request<any[]>(`/admin/audit-logs?limit=${limit}`),

  // ─── Operational ML ───
  getNoShowRisk: (appointmentId: number) =>
    request<NoShowRisk>(`/ml/no-show-risk/${appointmentId}`),
  getDemandForecast: (hospitalId: number, service: string) =>
    request<DemandForecast>(`/ml/demand-forecast?hospital_id=${hospitalId}&service=${encodeURIComponent(service)}`),
  getResourcePriority: (params: {
    resource_id: number;
    resource_name: string;
    distance_km: number;
    is_available: boolean;
    urgency: string;
    wait_time_minutes: number;
  }) => {
    const q = new URLSearchParams({
      resource_id: params.resource_id.toString(),
      resource_name: params.resource_name,
      distance_km: params.distance_km.toString(),
      is_available: params.is_available.toString(),
      urgency: params.urgency,
      wait_time_minutes: params.wait_time_minutes.toString(),
    });
    return request<ResourcePriority>(`/ml/resource-priority?${q.toString()}`);
  },

  // ─── Simulated Assistant ───
  sendAssistantChat: (message: string, channel = 'whatsapp') =>
    request<AssistantMessageResponse>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, channel }),
    }),

  simulateVoiceCall: (message: string) =>
    request<AssistantMessageResponse>('/assistant/voice/simulate', {
      method: 'POST',
      body: JSON.stringify({ message, channel: 'voice' }),
    }),
};
