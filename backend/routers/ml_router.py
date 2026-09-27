"""
MediMitra — ML Router
Operational scheduling indicators and resource priority ranking.
Label rule: Always labeled as "operational", never "clinical" or "triage".
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Appointment, AppointmentStatus, UrgencyLevel, User
from backend.schemas import NoShowRiskOut, DemandForecastOut, ResourcePriorityOut
from backend.services.ml_service import ml_service
from backend.core.deps import get_current_user

router = APIRouter(prefix="/api/ml", tags=["Operational ML"])


@router.get("/no-show-risk/{appointment_id}", response_model=NoShowRiskOut)
def get_no_show_risk(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Evaluates operational no-show risk for scheduling optimization.
    """
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")

    lead_days = max(0, (appt.slot_time.date() - (appt.created_at.date() if appt.created_at else datetime.utcnow().date())).days)
    dow = appt.slot_time.weekday()

    # Patient attendance stats
    past_appts = db.query(Appointment).filter(
        Appointment.patient_id == appt.patient_id,
        Appointment.id != appt.id,
    ).all()

    past_count = len(past_appts)
    no_shows = sum(1 for a in past_appts if a.status == AppointmentStatus.NO_SHOW)

    result = ml_service.assess_no_show_risk(
        booking_lead_days=lead_days,
        day_of_week=dow,
        past_bookings=past_count,
        past_no_shows=no_shows,
    )

    return NoShowRiskOut(
        appointment_id=appointment_id,
        risk_level=result["risk_level"],
        score=result["score"],
        factors=result["factors"],
        disclaimer=result["disclaimer"],
    )


@router.get("/demand-forecast", response_model=DemandForecastOut)
def get_demand_forecast(
    hospital_id: int = Query(...),
    service: str = Query("General Medicine"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Operational demand forecast for hospital capacity management.
    """
    result = ml_service.forecast_demand(
        hospital_id=hospital_id,
        service=service,
        target_date=datetime.utcnow(),
        db=db,
    )

    return DemandForecastOut(
        hospital_id=hospital_id,
        service=service,
        forecast=result["forecast"],
        disclaimer=result["disclaimer"],
    )


@router.get("/resource-priority", response_model=ResourcePriorityOut)
def get_resource_priority(
    resource_id: int = Query(...),
    resource_name: str = Query("Resource"),
    distance_km: float = Query(5.0),
    is_available: bool = Query(True),
    urgency: UrgencyLevel = Query(UrgencyLevel.MEDIUM),
    wait_time_minutes: int = Query(15),
    _: User = Depends(get_current_user),
):
    """
    Operational matching score based on proximity, reported availability and wait time.
    """
    res = ml_service.calculate_resource_priority(
        distance_km=distance_km,
        is_available=is_available,
        urgency=urgency,
        wait_time_minutes=wait_time_minutes,
    )

    return ResourcePriorityOut(
        resource_id=resource_id,
        resource_name=resource_name,
        score=res["score"],
        distance_km=res["distance_km"],
        availability_factor=res["availability_factor"],
        urgency_factor=res["urgency_factor"],
        disclaimer=res["disclaimer"],
    )
