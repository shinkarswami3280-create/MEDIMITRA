"""
MediMitra — Admin Router
System-wide stats (live from DB rows, labeled as demo), audit logs, and resource management.
"""
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import (
    Ambulance, AmbulanceRequest, AmbulanceRequestStatus,
    Appointment, AppointmentStatus, BloodRequest, BloodRequestStatus,
    BloodResource, GovernmentScheme, Hospital, Patient, User, AuditLog
)
from backend.schemas import (
    AuditLogOut, HospitalOut, SystemStats, BloodResourceOut
)
from backend.core.deps import require_admin, get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=SystemStats)
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Live database counts for administrative oversight.
    No fabricated or static numbers.
    """
    today_start = datetime.combine(date.today(), datetime.min.time())

    total_patients = db.query(func.count(Patient.id)).scalar() or 0
    total_hospitals = db.query(func.count(Hospital.id)).filter(Hospital.is_active == True).scalar() or 0
    total_appointments = db.query(func.count(Appointment.id)).scalar() or 0
    appts_today = db.query(func.count(Appointment.id)).filter(Appointment.slot_time >= today_start).scalar() or 0
    open_blood = db.query(func.count(BloodRequest.id)).filter(
        BloodRequest.status.in_([BloodRequestStatus.OPEN, BloodRequestStatus.MATCHING])
    ).scalar() or 0
    active_amb = db.query(func.count(AmbulanceRequest.id)).filter(
        AmbulanceRequest.status.notin_([AmbulanceRequestStatus.COMPLETED, AmbulanceRequestStatus.CANCELLED])
    ).scalar() or 0
    total_banks = db.query(func.count(BloodResource.id)).filter(BloodResource.is_active == True).scalar() or 0
    total_schemes = db.query(func.count(GovernmentScheme.id)).filter(GovernmentScheme.is_active == True).scalar() or 0

    return SystemStats(
        total_patients=total_patients,
        total_hospitals=total_hospitals,
        total_appointments=total_appointments,
        appointments_today=appts_today,
        open_blood_requests=open_blood,
        active_ambulance_requests=active_amb,
        total_blood_banks=total_banks,
        total_schemes=total_schemes,
    )


@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    db: Session = Depends(get_db),
    limit: int = Query(50, le=200),
    current_user: User = Depends(require_admin),
):
    """View system audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [AuditLogOut.model_validate(l) for l in logs]


@router.post("/hospitals", response_model=HospitalOut, status_code=201)
def add_hospital(
    name: str,
    address: str,
    lat: float,
    lng: float,
    services: str = "[]",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    h = Hospital(name=name, address=address, lat=lat, lng=lng, services=services)
    db.add(h)
    db.add(AuditLog(user_id=current_user.id, action="CREATE_HOSPITAL", target=f"hospital:{name}"))
    db.commit()
    db.refresh(h)
    return HospitalOut.model_validate(h)


@router.delete("/hospitals/{hospital_id}")
def deactivate_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(404, "Hospital not found")
    h.is_active = False
    db.add(AuditLog(user_id=current_user.id, action="DEACTIVATE_HOSPITAL", target=f"hospital:{hospital_id}"))
    db.commit()
    return {"ok": True}
