"""
MediMitra — Patients, Hospitals, Notifications, Schemes, Documents Routers
All combined for efficiency.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import (
    Document, FinancialAssistance, GovernmentScheme,
    Hospital, Notification, Patient, User,
)
from backend.schemas import (
    DocumentOut, HospitalOut, NotificationOut, PatientOut,
    PatientProfileUpdate, SchemeCreate, SchemeOut, SchemeUpdate,
)
from backend.core.deps import (
    get_current_user, require_admin, require_patient, require_staff_or_admin,
)


# ═══════════════════════════════════════════════════════════
# PATIENTS
# ═══════════════════════════════════════════════════════════
patients_router = APIRouter(prefix="/api/patients", tags=["Patients"])


@patients_router.get("/profile", response_model=PatientOut)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(require_patient)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(404, "Patient profile not found")
    return PatientOut.model_validate(patient)


@patients_router.put("/profile", response_model=PatientOut)
def update_profile(
    req: PatientProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(404, "Patient profile not found")
    for field, val in req.model_dump(exclude_none=True).items():
        setattr(patient, field, val)
    db.commit()
    db.refresh(patient)
    return PatientOut.model_validate(patient)


# ═══════════════════════════════════════════════════════════
# HOSPITALS
# ═══════════════════════════════════════════════════════════
hospitals_router = APIRouter(prefix="/api/hospitals", tags=["Hospitals"])


@hospitals_router.get("", response_model=List[HospitalOut])
def list_hospitals(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return [HospitalOut.model_validate(h) for h in db.query(Hospital).filter(Hospital.is_active == True).all()]


@hospitals_router.get("/{hospital_id}", response_model=HospitalOut)
def get_hospital(hospital_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(404, "Hospital not found")
    return HospitalOut.model_validate(h)


# ═══════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════
notifications_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@notifications_router.get("", response_model=List[NotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    unread_only: bool = Query(False),
):
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.read == False)
    return [NotificationOut.model_validate(n) for n in q.order_by(Notification.created_at.desc()).limit(50).all()]


@notifications_router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    n.read = True
    db.commit()
    return {"ok": True}


@notifications_router.put("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"ok": True}


# ═══════════════════════════════════════════════════════════
# GOVERNMENT SCHEMES & FINANCIAL ASSISTANCE
# ═══════════════════════════════════════════════════════════
schemes_router = APIRouter(prefix="/api/schemes", tags=["Healthcare Assistance Hub"])


@schemes_router.get("", response_model=List[SchemeOut])
def list_schemes(
    db: Session = Depends(get_db),
    state: Optional[str] = Query(None),
    _: User = Depends(get_current_user),
):
    q = db.query(GovernmentScheme).filter(GovernmentScheme.is_active == True)
    if state:
        q = q.filter(GovernmentScheme.state.ilike(f"%{state}%"))
    return [SchemeOut.model_validate(s) for s in q.all()]


@schemes_router.get("/financial-assistance")
def list_financial_assistance(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    partners = db.query(FinancialAssistance).filter(FinancialAssistance.is_active == True).all()
    return [
        {"id": p.id, "partner_name": p.partner_name, "description": p.description,
         "eligibility": p.eligibility, "external_link": p.external_link}
        for p in partners
    ]


@schemes_router.get("/{scheme_id}", response_model=SchemeOut)
def get_scheme(scheme_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    s = db.query(GovernmentScheme).filter(GovernmentScheme.id == scheme_id).first()
    if not s:
        raise HTTPException(404, "Scheme not found")
    return SchemeOut.model_validate(s)


@schemes_router.post("", response_model=SchemeOut, status_code=201)
def create_scheme(
    req: SchemeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    scheme = GovernmentScheme(**req.model_dump())
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return SchemeOut.model_validate(scheme)


@schemes_router.put("/{scheme_id}", response_model=SchemeOut)
def update_scheme(
    scheme_id: int,
    req: SchemeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin edits a scheme record in the DB — what the patient sees updates instantly."""
    from backend.models import AuditLog
    s = db.query(GovernmentScheme).filter(GovernmentScheme.id == scheme_id).first()
    if not s:
        raise HTTPException(404, "Scheme not found")
    for field, val in req.model_dump(exclude_none=True).items():
        setattr(s, field, val)
    db.add(AuditLog(user_id=current_user.id, action="UPDATE_SCHEME",
                    target=f"scheme:{scheme_id}", details=str(req.model_dump(exclude_none=True))))
    db.commit()
    db.refresh(s)
    return SchemeOut.model_validate(s)


@schemes_router.delete("/{scheme_id}")
def delete_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    s = db.query(GovernmentScheme).filter(GovernmentScheme.id == scheme_id).first()
    if not s:
        raise HTTPException(404, "Scheme not found")
    s.is_active = False  # Soft delete
    db.commit()
    return {"ok": True}


# ═══════════════════════════════════════════════════════════
# DOCUMENTS
# ═══════════════════════════════════════════════════════════
documents_router = APIRouter(prefix="/api/documents", tags=["Documents"])


@documents_router.get("", response_model=List[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        return []
    return [
        DocumentOut.model_validate(d)
        for d in db.query(Document).filter(Document.patient_id == patient.id).order_by(Document.created_at.desc()).all()
    ]
