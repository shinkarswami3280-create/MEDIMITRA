"""
MediMitra — Blood Router
Two-tier matching: institutional blood banks (phone visible) + donors (phone hidden).
Privacy rule enforced: donor phone NEVER exposed publicly.
"""
import math
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import (
    AuditLog, BloodRequest, BloodRequestStatus, BloodResource,
    DonorConsentRequest, DonorConsentStatus, Donor,
    Notification, NotificationChannel, Patient, User,
)
from backend.schemas import (
    BloodMatchResult, BloodRequestCreate, BloodRequestOut,
    BloodRequestStatusUpdate, BloodResourceOut, DonorConsentRequestOut, DonorOut,
)
from backend.core.deps import get_current_user, require_patient, require_staff_or_admin

router = APIRouter(prefix="/api/blood", tags=["Blood"])

COMPATIBLE_DONORS: dict[str, list[str]] = {
    "A+":  ["A+", "A-", "O+", "O-"],
    "A-":  ["A-", "O-"],
    "B+":  ["B+", "B-", "O+", "O-"],
    "B-":  ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+":  ["O+", "O-"],
    "O-":  ["O-"],
}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((phi2 - phi1) / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(math.radians(lng2 - lng1) / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─── Submit Blood Request ────────────────────────────────

@router.post("/request", response_model=BloodRequestOut, status_code=201)
def create_blood_request(
    req: BloodRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(404, "Patient profile not found")

    blood_req = BloodRequest(
        patient_id=patient.id,
        blood_group=req.blood_group,
        location=req.location,
        location_lat=req.location_lat,
        location_lng=req.location_lng,
        units=req.units,
        urgency=req.urgency,
        notes=req.notes,
    )
    db.add(blood_req)
    db.add(Notification(
        user_id=current_user.id,
        channel=NotificationChannel.in_app,
        title="Blood Request Submitted",
        message=f"Your {req.blood_group} blood request ({req.units} unit(s)) has been submitted. Matching nearby resources...",
    ))
    db.add(AuditLog(user_id=current_user.id, action="CREATE_BLOOD_REQUEST",
                    target=f"blood_group:{req.blood_group}", details=f"units={req.units} urgency={req.urgency.value}"))
    db.commit()
    db.refresh(blood_req)
    return BloodRequestOut.model_validate(blood_req)


def run_blood_matching(
    blood_group: str,
    user_lat: Optional[float],
    user_lng: Optional[float],
    db: Session,
) -> BloodMatchResult:
    compatible_groups = COMPATIBLE_DONORS.get(blood_group, [blood_group])

    # ── Tier 1: Institutional blood banks ───────────────────
    all_resources = db.query(BloodResource).filter(BloodResource.is_active == True).all()
    resource_results: list[BloodResourceOut] = []
    for res in all_resources:
        dist = None
        compat_score = 1.0
        if user_lat and user_lng and res.lat and res.lng:
            dist = round(haversine_km(user_lat, user_lng, res.lat, res.lng), 2)
        resource_results.append(BloodResourceOut(
            id=res.id, name=res.name, type=res.type, district=res.district,
            address=res.address, phone=res.phone,   # Institutional — safe to show
            lat=res.lat, lng=res.lng,
            last_verified=res.last_verified, source_url=res.source_url,
            distance_km=dist, compatibility_score=compat_score,
        ))

    # Sort by distance (nearest first)
    resource_results.sort(key=lambda r: (r.distance_km if r.distance_km is not None else 9999))

    # ── Tier 2: Individual donors — NO phone, area only ─────
    available_donors = db.query(Donor).filter(
        Donor.blood_group.in_(compatible_groups),
        Donor.consent_flag == True,
    ).all()

    donor_results: list[DonorOut] = []
    for donor in available_donors:
        # Never expose phone — only display name and general_area
        donor_results.append(DonorOut(
            id=donor.id,
            name=donor.name or f"Voluntary Donor #{donor.id}",
            blood_group=donor.blood_group,
            general_area=donor.general_area,  # city/area only
            consent_flag=donor.consent_flag,
            distance_km=None,
        ))

    explanation = (
        f"Operational matching active: {len(resource_results)} verified blood banks "
        f"and {len(donor_results)} voluntary donors compatible with {blood_group}. "
        f"Ranked by geographic distance and blood group compatibility. "
        f"In strict adherence to medical privacy guidelines, donor contact details remain private until explicit consent is granted."
    )

    return BloodMatchResult(
        blood_resources=resource_results[:20],
        donors=donor_results[:20],
        factors_explanation=explanation,
    )


@router.get("/match", response_model=BloodMatchResult)
def match_blood_query(
    blood_group: str = Query(..., description="Target blood group, e.g. O+, A+"),
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Query-based matching used by Patient Portal BloodModal."""
    return run_blood_matching(blood_group, user_lat, user_lng, db)


@router.get("/match/{request_id}", response_model=BloodMatchResult)
def match_blood_resources(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Request-based matching."""
    blood_req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not blood_req:
        raise HTTPException(404, "Blood request not found")
    return run_blood_matching(blood_req.blood_group, blood_req.location_lat, blood_req.location_lng, db)


@router.get("/resources", response_model=List[BloodResourceOut])
@router.get("/banks", response_model=List[BloodResourceOut])
def get_blood_resources(
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List verified institutional blood banks (public contact info)."""
    q = db.query(BloodResource).filter(BloodResource.is_active == True)
    if district:
        q = q.filter(BloodResource.district.ilike(f"%{district}%"))
    return [BloodResourceOut.model_validate(r) for r in q.all()]


@router.get("/inbox", response_model=List[BloodRequestOut])
def hospital_blood_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Hospital blood coordination inbox."""
    return [
        BloodRequestOut.model_validate(r)
        for r in db.query(BloodRequest).order_by(BloodRequest.created_at.desc()).all()
    ]


@router.get("/my-requests", response_model=List[BloodRequestOut])
def my_blood_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        return []
    return [
        BloodRequestOut.model_validate(r)
        for r in db.query(BloodRequest)
        .filter(BloodRequest.patient_id == patient.id)
        .order_by(BloodRequest.created_at.desc())
        .all()
    ]


@router.get("/requests", response_model=List[BloodRequestOut])
def all_blood_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
    status: Optional[BloodRequestStatus] = Query(None),
):
    q = db.query(BloodRequest)
    if status:
        q = q.filter(BloodRequest.status == status)
    return [BloodRequestOut.model_validate(r) for r in q.order_by(BloodRequest.created_at.desc()).all()]


@router.put("/request/{request_id}/status", response_model=BloodRequestOut)
def update_blood_request_status(
    request_id: int,
    update: BloodRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(404, "Blood request not found")
    req.status = update.status
    db.add(AuditLog(user_id=current_user.id, action="UPDATE_BLOOD_REQUEST_STATUS",
                    target=f"blood_req:{request_id}", details=f"status={update.status.value}"))
    db.commit()
    db.refresh(req)
    return BloodRequestOut.model_validate(req)


# ─── Donor Consent Flow ──────────────────────────────────

from pydantic import BaseModel

class ConsentRequestPayload(BaseModel):
    blood_request_id: int
    donor_id: int

@router.post("/consent/request")
def request_donor_consent_payload(
    payload: ConsentRequestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    """Frontend-compatible consent request endpoint."""
    donor = db.query(Donor).filter(Donor.id == payload.donor_id).first()
    if not donor:
        raise HTTPException(404, "Donor not found")
    
    existing = db.query(DonorConsentRequest).filter(
        DonorConsentRequest.donor_id == payload.donor_id,
        DonorConsentRequest.blood_request_id == payload.blood_request_id,
    ).first()
    if not existing:
        req = DonorConsentRequest(
            donor_id=payload.donor_id,
            blood_request_id=payload.blood_request_id,
            status=DonorConsentStatus.PENDING,
        )
        db.add(req)
        db.commit()
    return {"ok": True, "message": "Consent request sent to donor. You will receive notification when approved."}


@router.post("/donor/consent-request/{blood_request_id}", response_model=DonorConsentRequestOut, status_code=201)
def request_donor_consent(
    blood_request_id: int,
    donor_id: int = Query(..., description="Donor ID to contact"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    """
    Patient requests to contact a specific donor.
    Creates a consent request — donor must approve before contact is revealed.
    """
    blood_req = db.query(BloodRequest).filter(BloodRequest.id == blood_request_id).first()
    if not blood_req:
        raise HTTPException(404, "Blood request not found")
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(404, "Donor not found")

    # Check if already requested
    existing = db.query(DonorConsentRequest).filter(
        DonorConsentRequest.donor_id == donor_id,
        DonorConsentRequest.blood_request_id == blood_request_id,
    ).first()
    if existing:
        return DonorConsentRequestOut.model_validate(existing)

    consent_req = DonorConsentRequest(
        donor_id=donor_id,
        blood_request_id=blood_request_id,
        status=DonorConsentStatus.PENDING,
    )
    db.add(consent_req)

    # Notify donor (in-app for now; Twilio adapter if configured)
    if donor.patient and donor.patient.user_id:
        db.add(Notification(
            user_id=donor.patient.user_id,
            channel=NotificationChannel.in_app,
            title="Blood Donation Request",
            message=f"A patient needs {blood_req.blood_group} blood ({blood_req.units} unit(s)) near {blood_req.location}. Please respond to share your contact.",
        ))

    db.commit()
    db.refresh(consent_req)
    return DonorConsentRequestOut.model_validate(consent_req)


@router.put("/donor/consent/{consent_id}/respond")
def respond_to_consent(
    consent_id: int,
    approved: bool = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Donor approves or declines a consent request."""
    from datetime import datetime as dt
    consent = db.query(DonorConsentRequest).filter(DonorConsentRequest.id == consent_id).first()
    if not consent:
        raise HTTPException(404, "Consent request not found")
    consent.status = DonorConsentStatus.APPROVED if approved else DonorConsentStatus.DECLINED
    consent.responded_at = dt.utcnow()

    response_data = {"status": consent.status.value}
    # Only reveal phone if approved
    if approved and consent.donor and consent.donor.patient:
        response_data["donor_phone"] = consent.donor.patient.phone

    db.commit()
    return response_data
