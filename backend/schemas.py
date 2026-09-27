"""
MediMitra — Pydantic Schemas (request/response models)
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator

from backend.models import (
    AppointmentStatus, AmbulanceStatus, AmbulanceRequestStatus,
    BloodResourceType, BloodRequestStatus, DonorConsentStatus,
    NotificationChannel, UrgencyLevel, UserRole,
)


# ─────────────── Auth ───────────────

class RegisterRequest(BaseModel):
    phone: str
    password: str
    name: str
    role: UserRole = UserRole.patient


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    name: str


class UserOut(BaseModel):
    id: int
    phone: str
    name: str
    role: UserRole
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────── Patient ───────────────

class PatientProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None


class PatientOut(BaseModel):
    id: int
    user_id: int
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: str
    blood_group: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────── Hospital ───────────────

class HospitalOut(BaseModel):
    id: int
    name: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    services: Optional[str] = None

    class Config:
        from_attributes = True


# ─────────────── Appointment Slots ───────────────

class SlotOut(BaseModel):
    id: int
    hospital_id: int
    service: str
    slot_datetime: datetime
    capacity: int
    booked: int
    is_available: bool

    class Config:
        from_attributes = True


# ─────────────── Appointments ───────────────

class AppointmentCreate(BaseModel):
    hospital_id: int
    service: str
    slot_id: int
    notes: Optional[str] = None


class AppointmentReschedule(BaseModel):
    new_slot_id: int


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    notes: Optional[str] = None


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    hospital_id: int
    service: str
    slot_time: datetime
    status: AppointmentStatus
    source: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    hospital: Optional[HospitalOut] = None

    class Config:
        from_attributes = True


# ─────────────── Ambulance ───────────────

class AmbulanceOut(BaseModel):
    id: int
    hospital_id: int
    driver_name: str
    vehicle_number: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: AmbulanceStatus
    # Note: phone is NOT included in this schema — only exposed to hospital staff

    class Config:
        from_attributes = True


class AmbulanceRequestCreate(BaseModel):
    pickup_lat: float
    pickup_lng: float
    pickup_address: Optional[str] = None
    destination_hospital_id: Optional[int] = None
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    patient_contact: Optional[str] = None
    notes: Optional[str] = None


class AmbulanceStatusUpdate(BaseModel):
    status: AmbulanceRequestStatus
    eta_minutes: Optional[int] = None


class AmbulanceRequestOut(BaseModel):
    id: int
    patient_id: int
    pickup_lat: float
    pickup_lng: float
    pickup_address: Optional[str] = None
    destination_hospital_id: Optional[int] = None
    urgency: UrgencyLevel
    status: AmbulanceRequestStatus
    ambulance_id: Optional[int] = None
    eta_minutes: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NearestAmbulanceOut(BaseModel):
    ambulance: AmbulanceOut
    distance_km: float
    hospital_name: str


# ─────────────── Blood ───────────────

class BloodResourceOut(BaseModel):
    id: int
    name: str
    type: BloodResourceType
    district: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None       # Institutional — safe to show
    lat: Optional[float] = None
    lng: Optional[float] = None
    last_verified: Optional[str] = None
    source_url: Optional[str] = None
    distance_km: Optional[float] = None
    compatibility_score: Optional[float] = None

    class Config:
        from_attributes = True


class DonorOut(BaseModel):
    id: int
    name: Optional[str] = None
    blood_group: str
    general_area: Optional[str] = None   # Area only — NO phone ever
    # phone intentionally omitted — see privacy rule
    consent_flag: bool
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True


class BloodRequestCreate(BaseModel):
    blood_group: str
    location: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    units: int = 1
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    notes: Optional[str] = None


class BloodRequestStatusUpdate(BaseModel):
    status: BloodRequestStatus


class BloodRequestOut(BaseModel):
    id: int
    patient_id: int
    blood_group: str
    location: Optional[str] = None
    units: int
    urgency: UrgencyLevel
    status: BloodRequestStatus
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BloodMatchResult(BaseModel):
    blood_resources: List[BloodResourceOut]
    donors: List[DonorOut]
    factors_explanation: str


class DonorConsentRequestOut(BaseModel):
    id: int
    donor_id: int
    blood_request_id: int
    status: DonorConsentStatus

    class Config:
        from_attributes = True


# ─────────────── Notifications ───────────────

class NotificationOut(BaseModel):
    id: int
    channel: NotificationChannel
    message: str
    title: Optional[str] = None
    read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────── Government Schemes ───────────────

class SchemeCreate(BaseModel):
    name: str
    state: str
    description: Optional[str] = None
    eligibility: Optional[str] = None
    documents: Optional[str] = None
    official_website: Optional[str] = None
    official_contact: Optional[str] = None
    source: Optional[str] = None
    last_verified: Optional[str] = None


class SchemeUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    description: Optional[str] = None
    eligibility: Optional[str] = None
    documents: Optional[str] = None
    official_website: Optional[str] = None
    official_contact: Optional[str] = None
    source: Optional[str] = None
    last_verified: Optional[str] = None


class SchemeOut(BaseModel):
    id: int
    name: str
    state: str
    description: Optional[str] = None
    eligibility: Optional[str] = None
    documents: Optional[str] = None
    official_website: Optional[str] = None
    official_contact: Optional[str] = None
    source: Optional[str] = None
    last_verified: Optional[str] = None

    class Config:
        from_attributes = True


# ─────────────── Documents ───────────────

class DocumentOut(BaseModel):
    id: int
    type: Optional[str] = None
    filename: Optional[str] = None
    file_size_kb: Optional[int] = None
    is_demo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────── Admin ───────────────

class SystemStats(BaseModel):
    total_patients: int
    total_hospitals: int
    total_appointments: int
    appointments_today: int
    open_blood_requests: int
    active_ambulance_requests: int
    total_blood_banks: int
    total_schemes: int


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    target: Optional[str] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────── ML ───────────────

class NoShowRiskOut(BaseModel):
    appointment_id: int
    risk_level: str  # LOW | MEDIUM | HIGH
    score: float
    factors: List[str]
    disclaimer: str = "This is an operational scheduling indicator. Not a medical assessment."


class DemandForecastOut(BaseModel):
    hospital_id: int
    service: str
    forecast: str   # LOW | MEDIUM | HIGH
    disclaimer: str = "Operational demand forecast based on historical booking patterns."


class ResourcePriorityOut(BaseModel):
    resource_id: int
    resource_name: str
    score: float
    distance_km: float
    availability_factor: str
    urgency_factor: str
    disclaimer: str = "Operational resource ranking. Not a clinical or medical priority assessment."


# ─────────────── Assistant ───────────────

class AssistantMessage(BaseModel):
    message: str
    channel: str = "whatsapp"   # whatsapp | voice


class AssistantResponse(BaseModel):
    intent: str
    response: str
    action_taken: Optional[str] = None
    is_simulated: bool = True
