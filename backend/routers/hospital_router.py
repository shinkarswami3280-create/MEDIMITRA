"""
MediMitra — Hospital Staff & Emergency Command Center Router
Provides real-time queues for hospital staff:
- Emergency Command Center (Ambulances, Blood Requests, Urgent arrivals)
- Appointment Queue with immediate status transitions
- Operational metrics (from live DB rows)
- CSV / Sheets export
"""
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import (
    Ambulance, AmbulanceRequest, AmbulanceRequestStatus,
    Appointment, AppointmentStatus, BloodRequest, BloodRequestStatus,
    Hospital, HospitalStaff, Patient, User, UserRole, AuditLog
)
from backend.schemas import (
    AppointmentOut, AmbulanceRequestOut, BloodRequestOut
)
from backend.core.deps import require_staff_or_admin, get_current_user
from backend.services.export_service import export_service

router = APIRouter(prefix="/api/hospital", tags=["Hospital Operations"])


@router.get("/command-center")
def get_command_center_feed(
    hospital_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """
    Emergency Command Center view:
    Shows all active ambulances, urgent blood requests, and today's emergency appointments.
    """
    # 1. Active Ambulance Inflow
    amb_q = db.query(AmbulanceRequest).filter(
        AmbulanceRequest.status.notin_([
            AmbulanceRequestStatus.COMPLETED,
            AmbulanceRequestStatus.CANCELLED
        ])
    )
    if hospital_id:
        amb_q = amb_q.filter(AmbulanceRequest.destination_hospital_id == hospital_id)
    active_ambulances = amb_q.order_by(AmbulanceRequest.created_at.desc()).all()

    # 2. Active Urgent Blood Requests
    blood_requests = db.query(BloodRequest).filter(
        BloodRequest.status.in_([BloodRequestStatus.OPEN, BloodRequestStatus.MATCHING])
    ).order_by(BloodRequest.created_at.desc()).all()

    # 3. Urgent / Pending Appointments
    appt_q = db.query(Appointment).filter(
        Appointment.status.in_([AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED])
    )
    if hospital_id:
        appt_q = appt_q.filter(Appointment.hospital_id == hospital_id)
    active_appts = appt_q.order_by(Appointment.slot_time).limit(20).all()

    return {
        "active_ambulances_count": len(active_ambulances),
        "open_blood_requests_count": len(blood_requests),
        "pending_appointments_count": len(active_appts),
        "ambulances": [
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "patient_name": a.patient.name if a.patient else "Patient",
                "pickup_address": a.pickup_address,
                "urgency": a.urgency.value,
                "status": a.status.value,
                "eta_minutes": a.eta_minutes,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in active_ambulances
        ],
        "blood_requests": [
            {
                "id": b.id,
                "patient_name": b.patient.name if b.patient else "Patient",
                "blood_group": b.blood_group,
                "units": b.units,
                "urgency": b.urgency.value,
                "status": b.status.value,
                "location": b.location,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in blood_requests
        ],
        "appointments": [
            {
                "id": appt.id,
                "patient_name": appt.patient.name if appt.patient else "Patient",
                "phone": appt.patient.phone if appt.patient else "",
                "service": appt.service,
                "slot_time": appt.slot_time.isoformat() if appt.slot_time else None,
                "status": appt.status.value,
                "source": appt.source,
            }
            for appt in active_appts
        ],
    }


@router.get("/export/appointments/csv")
def export_appointments_csv(
    hospital_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Exports hospital appointments to downloadable CSV (zero external config)."""
    csv_data = export_service.export_appointments_csv(db, hospital_id=hospital_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=appointments_hospital_{hospital_id}.csv"},
    )


@router.post("/export/sync-sheets")
def sync_google_sheets(
    hospital_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Optional mirror to Google Sheets (gracefully warns if credentials absent)."""
    appts = db.query(Appointment).filter(Appointment.hospital_id == hospital_id).all()
    rows = [["ID", "Patient Name", "Phone", "Service", "Slot Time", "Status", "Source"]]
    for a in appts:
        rows.append([
            str(a.id),
            a.patient.name if a.patient else "",
            a.patient.phone if a.patient else "",
            a.service,
            a.slot_time.strftime("%Y-%m-%d %H:%M"),
            a.status.value,
            a.source or "web",
        ])

    success, msg = export_service.sync_to_google_sheets("HospitalAppointments", rows)
    return {"success": success, "message": msg}
