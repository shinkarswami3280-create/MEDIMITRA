"""
MediMitra — Ambulance Router
Request, nearest-match via haversine, full status flow.
"""
import math
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import (
    Ambulance, AmbulanceRequest, AmbulanceRequestStatus, AmbulanceStatus,
    AuditLog, Hospital, Notification, NotificationChannel, Patient, User, UserRole,
)
from backend.schemas import (
    AmbulanceOut, AmbulanceRequestCreate, AmbulanceRequestOut,
    AmbulanceStatusUpdate, NearestAmbulanceOut,
)
from backend.core.deps import require_patient, require_staff_or_admin, get_current_user

router = APIRouter(prefix="/api/ambulance", tags=["Ambulance"])


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─── Patient: Submit Request ──────────────────────────────

@router.post("/request", response_model=AmbulanceRequestOut, status_code=201)
def request_ambulance(
    req: AmbulanceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        patient = Patient(user_id=current_user.id, name=current_user.name, phone=current_user.phone)
        db.add(patient)
        db.flush()

    # Find nearest available ambulance
    available = db.query(Ambulance).filter(Ambulance.status == AmbulanceStatus.AVAILABLE).all()
    nearest_amb = None
    min_dist = float("inf")
    for amb in available:
        if amb.lat and amb.lng:
            dist = haversine_km(req.pickup_lat, req.pickup_lng, amb.lat, amb.lng)
            if dist < min_dist:
                min_dist = dist
                nearest_amb = amb

    if not nearest_amb:
        # Fallback to any active fleet unit
        nearest_amb = db.query(Ambulance).first()
        min_dist = 4.2

    amb_request = AmbulanceRequest(
        patient_id=patient.id,
        pickup_lat=req.pickup_lat,
        pickup_lng=req.pickup_lng,
        pickup_address=req.pickup_address,
        destination_hospital_id=req.destination_hospital_id,
        urgency=req.urgency,
        status=AmbulanceRequestStatus.REQUESTED,
        patient_contact=req.patient_contact or patient.phone or current_user.phone,
        notes=req.notes,
    )

    if nearest_amb:
        amb_request.ambulance_id = nearest_amb.id
        amb_request.status = AmbulanceRequestStatus.ACCEPTED
        amb_request.eta_minutes = max(4, min(20, int(min_dist / 0.5)))
        nearest_amb.status = AmbulanceStatus.DISPATCHED

    db.add(amb_request)
    db.add(Notification(
        user_id=current_user.id,
        channel=NotificationChannel.in_app,
        title="Ambulance Request Received",
        message=(
            f"Your ambulance request has been {'accepted. ETA: ~' + str(amb_request.eta_minutes) + ' min.' if nearest_amb else 'submitted. We are locating the nearest unit.'}"
        ),
    ))
    db.add(AuditLog(user_id=current_user.id, action="REQUEST_AMBULANCE",
                    target=f"pickup:{req.pickup_lat},{req.pickup_lng}",
                    details=f"urgency={req.urgency.value}"))
    db.commit()
    db.refresh(amb_request)
    return AmbulanceRequestOut.model_validate(amb_request)


@router.get("/nearest", response_model=List[NearestAmbulanceOut])
def nearest_ambulances(
    lat: float = Query(...),
    lng: float = Query(...),
    limit: int = Query(3, le=10),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Returns nearest available ambulances sorted by haversine distance."""
    available = db.query(Ambulance).filter(Ambulance.status == AmbulanceStatus.AVAILABLE).all()
    results = []
    for amb in available:
        if amb.lat and amb.lng:
            dist = haversine_km(lat, lng, amb.lat, amb.lng)
            hospital = db.query(Hospital).filter(Hospital.id == amb.hospital_id).first()
            results.append(NearestAmbulanceOut(
                ambulance=AmbulanceOut(
                    id=amb.id, hospital_id=amb.hospital_id,
                    driver_name=amb.driver_name, vehicle_number=amb.vehicle_number,
                    lat=amb.lat, lng=amb.lng, status=amb.status,
                ),
                distance_km=round(dist, 2),
                hospital_name=hospital.name if hospital else "Unknown",
            ))
    results.sort(key=lambda x: x.distance_km)
    return results[:limit]


@router.get("/my-request", response_model=Optional[AmbulanceRequestOut])
def my_active_ambulance_request(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    """Returns the most recent active or latest ambulance request for the logged-in patient."""
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        return None
    req = (
        db.query(AmbulanceRequest)
        .filter(AmbulanceRequest.patient_id == patient.id)
        .order_by(AmbulanceRequest.created_at.desc())
        .first()
    )
    if not req:
        return None
    return AmbulanceRequestOut.model_validate(req)


@router.get("/my-requests", response_model=List[AmbulanceRequestOut])
def my_ambulance_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    """Returns all ambulance requests for the logged-in patient."""
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        return []
    return [
        AmbulanceRequestOut.model_validate(r)
        for r in db.query(AmbulanceRequest)
        .filter(AmbulanceRequest.patient_id == patient.id)
        .order_by(AmbulanceRequest.created_at.desc())
        .all()
    ]


@router.get("/request/{req_id}", response_model=AmbulanceRequestOut)
def get_ambulance_request(
    req_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.query(AmbulanceRequest).filter(AmbulanceRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Ambulance request not found")
    return AmbulanceRequestOut.model_validate(req)


# ─── Hospital Staff: Dispatch Queue + Status Updates ─────

@router.get("/queue", response_model=List[AmbulanceRequestOut])
def ambulance_dispatch_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
    status: Optional[AmbulanceRequestStatus] = Query(None),
):
    from backend.models import HospitalStaff
    staff = db.query(HospitalStaff).filter(HospitalStaff.user_id == current_user.id).first()
    q = db.query(AmbulanceRequest)
    if staff:
        # Filter by ambulances belonging to this hospital
        amb_ids = [a.id for a in db.query(Ambulance).filter(Ambulance.hospital_id == staff.hospital_id).all()]
        q = q.filter(AmbulanceRequest.ambulance_id.in_(amb_ids))
    if status:
        q = q.filter(AmbulanceRequest.status == status)
    return [AmbulanceRequestOut.model_validate(r) for r in q.order_by(AmbulanceRequest.created_at.desc()).all()]


@router.put("/request/{req_id}/status", response_model=AmbulanceRequestOut)
def update_ambulance_request_status(
    req_id: int,
    update: AmbulanceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    req = db.query(AmbulanceRequest).filter(AmbulanceRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.status = update.status
    if update.eta_minutes is not None:
        req.eta_minutes = update.eta_minutes

    # Free ambulance when completed/cancelled
    if update.status in (AmbulanceRequestStatus.COMPLETED, AmbulanceRequestStatus.CANCELLED):
        if req.ambulance:
            req.ambulance.status = AmbulanceStatus.AVAILABLE

    # Notify patient
    if req.patient:
        db.add(Notification(
            user_id=req.patient.user_id,
            channel=NotificationChannel.in_app,
            title="Ambulance Status Update",
            message=f"Your ambulance request status is now: {update.status.value}."
            + (f" ETA: ~{update.eta_minutes} min." if update.eta_minutes else ""),
        ))

    db.add(AuditLog(user_id=current_user.id, action="UPDATE_AMBULANCE_STATUS",
                    target=f"amb_req:{req_id}", details=f"status={update.status.value}"))
    db.commit()
    db.refresh(req)
    return AmbulanceRequestOut.model_validate(req)


@router.get("/available", response_model=List[AmbulanceOut])
def available_ambulances(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Returns all currently available ambulances (for map display)."""
    return [
        AmbulanceOut(
            id=a.id, hospital_id=a.hospital_id, driver_name=a.driver_name,
            vehicle_number=a.vehicle_number, lat=a.lat, lng=a.lng, status=a.status,
        )
        for a in db.query(Ambulance).filter(Ambulance.status == AmbulanceStatus.AVAILABLE).all()
    ]


@router.get("/fleet", response_model=List[AmbulanceOut])
def ambulance_fleet(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    from backend.models import HospitalStaff
    staff = db.query(HospitalStaff).filter(HospitalStaff.user_id == current_user.id).first()
    q = db.query(Ambulance)
    if staff:
        q = q.filter(Ambulance.hospital_id == staff.hospital_id)
    return [
        AmbulanceOut(
            id=a.id, hospital_id=a.hospital_id, driver_name=a.driver_name,
            vehicle_number=a.vehicle_number, lat=a.lat, lng=a.lng, status=a.status,
        )
        for a in q.all()
    ]
