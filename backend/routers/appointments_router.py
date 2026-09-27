"""
MediMitra — Appointments Router
Full CRUD + status transitions for patient and hospital-staff sides.
"""
from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import (
    Appointment, AppointmentSlot, AppointmentStatus,
    AuditLog, Hospital, Notification, NotificationChannel,
    Patient, User, UserRole,
)
from backend.schemas import (
    AppointmentCreate, AppointmentOut, AppointmentReschedule,
    AppointmentStatusUpdate, SlotOut,
)
from backend.core.deps import get_current_user, require_patient, require_staff_or_admin

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


# ─── Slots ──────────────────────────────────────────────

@router.get("/slots", response_model=List[SlotOut])
def get_slots(
    hospital_id: int = Query(...),
    service: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(AppointmentSlot).filter(AppointmentSlot.hospital_id == hospital_id)
    if service:
        q = q.filter(AppointmentSlot.service == service)
    if date_from:
        q = q.filter(AppointmentSlot.slot_datetime >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        q = q.filter(AppointmentSlot.slot_datetime <= datetime.combine(date_to, datetime.max.time()))
    slots = q.filter(AppointmentSlot.slot_datetime >= datetime.utcnow()).order_by(AppointmentSlot.slot_datetime).all()
    return [
        SlotOut(
            id=s.id, hospital_id=s.hospital_id, service=s.service,
            slot_datetime=s.slot_datetime, capacity=s.capacity,
            booked=s.booked, is_available=s.is_available,
        )
        for s in slots
    ]


# ─── Patient: Book / View / Cancel / Reschedule ─────────

@router.post("", response_model=AppointmentOut, status_code=201)
def book_appointment(
    req: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(404, "Patient profile not found")

    slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == req.slot_id).with_for_update().first()
    if not slot:
        raise HTTPException(404, "Slot not found")
    if not slot.is_available:
        raise HTTPException(409, "Slot is fully booked. Please choose another time.")
    if slot.hospital_id != req.hospital_id:
        raise HTTPException(400, "Slot does not belong to the specified hospital")

    slot.booked += 1

    appt = Appointment(
        patient_id=patient.id,
        hospital_id=req.hospital_id,
        slot_id=req.slot_id,
        service=req.service or slot.service,
        slot_time=slot.slot_datetime,
        status=AppointmentStatus.CONFIRMED,
        source="web",
        notes=req.notes,
    )
    db.add(appt)

    # Notification
    hospital = db.query(Hospital).filter(Hospital.id == req.hospital_id).first()
    db.add(Notification(
        user_id=current_user.id,
        channel=NotificationChannel.in_app,
        title="Appointment Confirmed",
        message=f"Your {appt.service} appointment at {hospital.name} is confirmed for {slot.slot_datetime.strftime('%d %b %Y, %I:%M %p')}.",
    ))

    # Audit
    db.add(AuditLog(user_id=current_user.id, action="BOOK_APPOINTMENT",
                    target=f"hospital:{req.hospital_id}",
                    details=f"service={appt.service} slot={slot.slot_datetime}"))
    db.commit()
    db.refresh(appt)
    return _appt_out(appt, db)


@router.get("/my", response_model=List[AppointmentOut])
def my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
    status: Optional[AppointmentStatus] = Query(None),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        return []
    q = db.query(Appointment).options(joinedload(Appointment.hospital)).filter(
        Appointment.patient_id == patient.id
    )
    if status:
        q = q.filter(Appointment.status == status)
    appts = q.order_by(Appointment.slot_time.desc()).all()
    return [_appt_out(a, db) for a in appts]


@router.put("/{appt_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    appt = _get_patient_appt(appt_id, current_user, db)
    if appt.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
        raise HTTPException(400, f"Cannot cancel an appointment with status {appt.status.value}")
    appt.status = AppointmentStatus.CANCELLED
    if appt.slot:
        appt.slot.booked = max(0, appt.slot.booked - 1)
    db.add(Notification(
        user_id=current_user.id,
        channel=NotificationChannel.in_app,
        title="Appointment Cancelled",
        message=f"Your {appt.service} appointment on {appt.slot_time.strftime('%d %b %Y')} has been cancelled.",
    ))
    db.add(AuditLog(user_id=current_user.id, action="CANCEL_APPOINTMENT", target=f"appt:{appt_id}"))
    db.commit()
    db.refresh(appt)
    return _appt_out(appt, db)


@router.put("/{appt_id}/reschedule", response_model=AppointmentOut)
def reschedule_appointment(
    appt_id: int,
    req: AppointmentReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    appt = _get_patient_appt(appt_id, current_user, db)
    if appt.status == AppointmentStatus.COMPLETED:
        raise HTTPException(400, "Cannot reschedule a completed appointment")

    new_slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == req.new_slot_id).with_for_update().first()
    if not new_slot or not new_slot.is_available:
        raise HTTPException(409, "New slot not available")

    # Release old slot
    if appt.slot:
        appt.slot.booked = max(0, appt.slot.booked - 1)

    new_slot.booked += 1
    appt.slot_id = new_slot.id
    appt.slot_time = new_slot.slot_datetime
    appt.status = AppointmentStatus.RESCHEDULED
    db.add(Notification(
        user_id=current_user.id,
        channel=NotificationChannel.in_app,
        title="Appointment Rescheduled",
        message=f"Your {appt.service} appointment has been rescheduled to {new_slot.slot_datetime.strftime('%d %b %Y, %I:%M %p')}.",
    ))
    db.add(AuditLog(user_id=current_user.id, action="RESCHEDULE_APPOINTMENT", target=f"appt:{appt_id}"))
    db.commit()
    db.refresh(appt)
    return _appt_out(appt, db)


# ─── Hospital Staff: Queue + Status Updates ─────────────

@router.get("/queue", response_model=List[AppointmentOut])
def hospital_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
    status: Optional[AppointmentStatus] = Query(None),
    date_filter: Optional[date] = Query(None),
):
    """Hospital staff sees all appointments for their hospital."""
    from backend.models import HospitalStaff
    staff = db.query(HospitalStaff).filter(HospitalStaff.user_id == current_user.id).first()
    if not staff and current_user.role != UserRole.admin:
        raise HTTPException(403, "Not associated with any hospital")

    q = db.query(Appointment).options(joinedload(Appointment.hospital), joinedload(Appointment.patient))
    if staff:
        q = q.filter(Appointment.hospital_id == staff.hospital_id)
    if status:
        q = q.filter(Appointment.status == status)
    if date_filter:
        q = q.filter(
            Appointment.slot_time >= datetime.combine(date_filter, datetime.min.time()),
            Appointment.slot_time <= datetime.combine(date_filter, datetime.max.time()),
        )
    return [_appt_out(a, db) for a in q.order_by(Appointment.slot_time).all()]


@router.put("/{appt_id}/status", response_model=AppointmentOut)
def update_appointment_status(
    appt_id: int,
    req: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    appt.status = req.status
    if req.notes:
        appt.notes = req.notes
    # Notify patient
    db.add(Notification(
        user_id=appt.patient.user_id,
        channel=NotificationChannel.in_app,
        title="Appointment Update",
        message=f"Your {appt.service} appointment status is now: {req.status.value}.",
    ))
    db.add(AuditLog(user_id=current_user.id, action="UPDATE_APPOINTMENT_STATUS",
                    target=f"appt:{appt_id}", details=f"status={req.status.value}"))
    db.commit()
    db.refresh(appt)
    return _appt_out(appt, db)


# ─── Helpers ────────────────────────────────────────────

def _get_patient_appt(appt_id: int, user: User, db: Session) -> Appointment:
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    appt = db.query(Appointment).filter(
        Appointment.id == appt_id, Appointment.patient_id == patient.id
    ).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    return appt


def _appt_out(appt: Appointment, db: Session) -> AppointmentOut:
    from backend.schemas import HospitalOut
    hospital = db.query(Hospital).filter(Hospital.id == appt.hospital_id).first()
    h_out = HospitalOut.model_validate(hospital) if hospital else None
    return AppointmentOut(
        id=appt.id, patient_id=appt.patient_id, hospital_id=appt.hospital_id,
        service=appt.service, slot_time=appt.slot_time, status=appt.status,
        source=appt.source, notes=appt.notes,
        created_at=appt.created_at, updated_at=appt.updated_at,
        hospital=h_out,
    )
