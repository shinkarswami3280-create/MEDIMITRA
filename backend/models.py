"""
MediMitra — SQLAlchemy ORM Models
Complete schema for all 16 tables + donor consent tracking.
Database: SQLite (demo) / PostgreSQL-compatible (production).
"""
from datetime import datetime
import enum

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.orm import relationship

from backend.database import Base


# ─────────────────────────── Enums ────────────────────────────

class UserRole(str, enum.Enum):
    patient = "patient"
    hospital_staff = "hospital_staff"
    admin = "admin"


class AppointmentStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    RESCHEDULED = "RESCHEDULED"
    NO_SHOW = "NO_SHOW"


class AmbulanceStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    DISPATCHED = "DISPATCHED"
    BUSY = "BUSY"
    MAINTENANCE = "MAINTENANCE"


class AmbulanceRequestStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    ACCEPTED = "ACCEPTED"
    DISPATCHED = "DISPATCHED"
    ARRIVING = "ARRIVING"
    ARRIVED = "ARRIVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class BloodResourceType(str, enum.Enum):
    bank = "bank"
    hospital = "hospital"


class BloodRequestStatus(str, enum.Enum):
    OPEN = "OPEN"
    MATCHING = "MATCHING"
    FULFILLED = "FULFILLED"
    CLOSED = "CLOSED"


class UrgencyLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class NotificationChannel(str, enum.Enum):
    in_app = "in_app"
    whatsapp = "whatsapp"
    voice = "voice"


class DonorConsentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"


# ─────────────────────────── Models ────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(15), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="user", uselist=False)
    staff = relationship("HospitalStaff", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer)
    gender = Column(String(20))
    phone = Column(String(15), nullable=False)
    blood_group = Column(String(5))
    address = Column(Text)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    ambulance_requests = relationship("AmbulanceRequest", back_populates="patient")
    blood_requests = relationship("BloodRequest", back_populates="patient")
    documents = relationship("Document", back_populates="patient")
    donor = relationship("Donor", back_populates="patient", uselist=False)


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=False)
    lat = Column(Float)
    lng = Column(Float)
    services = Column(Text)  # JSON string list
    is_active = Column(Boolean, default=True)

    staff = relationship("HospitalStaff", back_populates="hospital")
    slots = relationship("AppointmentSlot", back_populates="hospital")
    appointments = relationship("Appointment", back_populates="hospital")
    ambulances = relationship("Ambulance", back_populates="hospital")


class HospitalStaff(Base):
    __tablename__ = "hospital_staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)

    user = relationship("User", back_populates="staff")
    hospital = relationship("Hospital", back_populates="staff")


class AppointmentSlot(Base):
    __tablename__ = "appointment_slots"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    service = Column(String(100), nullable=False)
    slot_datetime = Column(DateTime, nullable=False)
    capacity = Column(Integer, default=5)
    booked = Column(Integer, default=0)

    hospital = relationship("Hospital", back_populates="slots")
    appointments = relationship("Appointment", back_populates="slot")

    @property
    def is_available(self) -> bool:
        return self.booked < self.capacity


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("appointment_slots.id"), nullable=True)
    service = Column(String(100), nullable=False)
    slot_time = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.REQUESTED)
    source = Column(String(50), default="web")  # web | whatsapp | voice
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="appointments")
    hospital = relationship("Hospital", back_populates="appointments")
    slot = relationship("AppointmentSlot", back_populates="appointments")


class Ambulance(Base):
    __tablename__ = "ambulances"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    driver_name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False)
    vehicle_number = Column(String(20))
    lat = Column(Float)
    lng = Column(Float)
    status = Column(Enum(AmbulanceStatus), default=AmbulanceStatus.AVAILABLE)

    hospital = relationship("Hospital", back_populates="ambulances")
    requests = relationship("AmbulanceRequest", back_populates="ambulance")


class AmbulanceRequest(Base):
    __tablename__ = "ambulance_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    pickup_lat = Column(Float, nullable=False)
    pickup_lng = Column(Float, nullable=False)
    pickup_address = Column(Text)
    destination_hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    urgency = Column(Enum(UrgencyLevel), default=UrgencyLevel.MEDIUM)
    status = Column(Enum(AmbulanceRequestStatus), default=AmbulanceRequestStatus.REQUESTED)
    ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=True)
    patient_contact = Column(String(15))
    notes = Column(Text)
    eta_minutes = Column(Integer)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="ambulance_requests")
    ambulance = relationship("Ambulance", back_populates="requests")
    destination_hospital = relationship("Hospital", foreign_keys=[destination_hospital_id])


class BloodResource(Base):
    """Institutional blood banks — phone number is shown publicly."""
    __tablename__ = "blood_resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(Enum(BloodResourceType), nullable=False)
    district = Column(String(100))
    address = Column(Text)
    phone = Column(String(15))
    lat = Column(Float)
    lng = Column(Float)
    last_verified = Column(String(20))
    source_url = Column(String(500), default="https://eraktkosh.in")
    is_active = Column(Boolean, default=True)


class Donor(Base):
    """Individual donors — phone is NEVER exposed publicly; only through consent."""
    __tablename__ = "donors"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    name = Column(String(150))             # Display name (first name + last initial)
    blood_group = Column(String(5), nullable=False)
    general_area = Column(String(100))     # City/area only — no precise address
    consent_flag = Column(Boolean, default=False)
    last_active = Column(DateTime, default=func.now())

    patient = relationship("Patient", back_populates="donor")
    consent_requests = relationship("DonorConsentRequest", back_populates="donor")


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    blood_group = Column(String(5), nullable=False)
    location = Column(String(200))
    location_lat = Column(Float)
    location_lng = Column(Float)
    units = Column(Integer, default=1)
    urgency = Column(Enum(UrgencyLevel), default=UrgencyLevel.MEDIUM)
    status = Column(Enum(BloodRequestStatus), default=BloodRequestStatus.OPEN)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="blood_requests")
    consent_requests = relationship("DonorConsentRequest", back_populates="blood_request")


class DonorConsentRequest(Base):
    """Tracks consent for revealing a donor's contact to a specific blood request."""
    __tablename__ = "donor_consent_requests"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id"), nullable=False)
    blood_request_id = Column(Integer, ForeignKey("blood_requests.id"), nullable=False)
    status = Column(Enum(DonorConsentStatus), default=DonorConsentStatus.PENDING)
    created_at = Column(DateTime, default=func.now())
    responded_at = Column(DateTime, nullable=True)

    donor = relationship("Donor", back_populates="consent_requests")
    blood_request = relationship("BloodRequest", back_populates="consent_requests")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    channel = Column(Enum(NotificationChannel), default=NotificationChannel.in_app)
    message = Column(Text, nullable=False)
    title = Column(String(200))
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="notifications")


class GovernmentScheme(Base):
    """Editable records — contact info stored in DB, never hardcoded in frontend."""
    __tablename__ = "government_schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    state = Column(String(100), nullable=False)
    description = Column(Text)
    eligibility = Column(Text)
    documents = Column(Text)
    official_website = Column(String(500))
    official_contact = Column(String(200))
    source = Column(String(500))         # Source URL for contact verification
    last_verified = Column(String(20))   # ISO date string
    is_active = Column(Boolean, default=True)


class FinancialAssistance(Base):
    __tablename__ = "financial_assistance"

    id = Column(Integer, primary_key=True, index=True)
    partner_name = Column(String(200), nullable=False)
    description = Column(Text)
    eligibility = Column(Text)
    external_link = Column(String(500))
    is_active = Column(Boolean, default=True)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    type = Column(String(50))   # bill | prescription | report | discharge
    filename = Column(String(300))
    file_size_kb = Column(Integer)
    is_demo = Column(Boolean, default=True)  # Marks synthetic demo data
    created_at = Column(DateTime, default=func.now())

    patient = relationship("Patient", back_populates="documents")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(200), nullable=False)
    target = Column(String(200))
    details = Column(Text)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="audit_logs")
