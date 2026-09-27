"""
MediMitra — Operational ML Service
Administrative & Operational scheduling and matching models.
CRITICAL MANDATE:
- NEVER medical diagnosis or clinical decision making.
- NEVER label operational rankings as "triage".
- Always provide honest operational explanations and graceful statistical fallbacks on sparse data.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models import Appointment, AppointmentStatus, Hospital, UrgencyLevel


class OperationalMLService:
    @staticmethod
    def assess_no_show_risk(
        booking_lead_days: int,
        day_of_week: int,
        past_bookings: int = 0,
        past_no_shows: int = 0,
    ) -> Dict[str, Any]:
        """
        Operational No-Show Risk Indicator.
        Determines scheduling reliability to suggest reminder frequency.
        """
        factors = []
        score = 0.15  # baseline probability

        # Factor 1: Lead time
        if booking_lead_days > 7:
            score += 0.35
            factors.append(f"Long lead time ({booking_lead_days} days in advance)")
        elif booking_lead_days > 3:
            score += 0.18
            factors.append(f"Moderate advance booking ({booking_lead_days} days)")
        else:
            factors.append("Short lead time (<3 days, typically higher attendance)")

        # Factor 2: Day of week (Weekend vs weekday operational patterns)
        if day_of_week in [5, 6]:  # Saturday / Sunday
            score += 0.15
            factors.append("Weekend appointment schedule")
        elif day_of_week == 0:  # Monday rush
            score += 0.08
            factors.append("Monday morning peak scheduling")

        # Factor 3: Historical attendance history
        if past_bookings > 0:
            no_show_rate = past_no_shows / past_bookings
            if no_show_rate > 0.4:
                score += 0.30
                factors.append(f"Historical missed appointments rate: {int(no_show_rate * 100)}%")
            elif no_show_rate == 0:
                score -= 0.10
                factors.append("Consistent past attendance history")

        # Normalize score
        score = min(max(score, 0.05), 0.95)

        if score > 0.55:
            level = "HIGH"
        elif score > 0.30:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "risk_level": level,
            "score": round(score, 2),
            "factors": factors,
            "disclaimer": "This is an operational scheduling indicator. Not a medical assessment.",
        }

    @staticmethod
    def forecast_demand(
        hospital_id: int,
        service: str,
        target_date: Optional[datetime] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Operational Demand Forecast.
        Estimates facility queue density (LOW/MEDIUM/HIGH) based on booking velocity
        and day-of-week demand, falling back gracefully to statistical baseline.
        """
        if target_date is None:
            target_date = datetime.utcnow() + timedelta(days=1)

        day_name = target_date.strftime("%A")

        # Historical statistical check if db session provided
        count = 0
        if db:
            count = db.query(func.count(Appointment.id)).filter(
                Appointment.hospital_id == hospital_id,
                Appointment.service == service,
            ).scalar() or 0

        # Baseline heuristic calculation
        # Peak services: General Medicine, Emergency, Pediatrics
        high_demand_services = ["General Medicine", "Emergency Care", "Pediatrics", "Cardiology"]
        is_high_volume = any(s.lower() in service.lower() for s in high_demand_services)

        if is_high_volume and target_date.weekday() in [0, 1, 4]:  # Mon, Tue, Fri
            forecast = "HIGH"
            reason = f"High typical patient inflow for {service} on {day_name}s"
        elif count > 5 or is_high_volume:
            forecast = "MEDIUM"
            reason = f"Moderate expected operational booking volume for {service}"
        else:
            forecast = "LOW"
            reason = f"Steady operational capacity expected for {service}"

        return {
            "hospital_id": hospital_id,
            "service": service,
            "forecast": forecast,
            "day": day_name,
            "historical_sample_size": count,
            "explanation": reason,
            "disclaimer": "Operational demand forecast based on historical booking patterns.",
        }

    @staticmethod
    def calculate_resource_priority(
        distance_km: float,
        is_available: bool,
        urgency: UrgencyLevel,
        wait_time_minutes: int = 15,
    ) -> Dict[str, Any]:
        """
        Operational Resource Priority Score for dispatch/matching ranking.
        Scores from 0 to 100 based strictly on operational efficiency factors:
        proximity, reported status, user-stated urgency, and current queue time.
        NEVER label as triage.
        """
        score = 50.0  # baseline

        # 1. Proximity score (closer is higher priority)
        dist_factor = max(0.0, 30.0 - min(distance_km, 30.0))  # up to +30 pts for proximity
        score += dist_factor

        # 2. Availability status
        avail_factor = 20.0 if is_available else -25.0
        score += avail_factor

        # 3. Urgency level stated by user
        urgency_points = {
            UrgencyLevel.CRITICAL: 25.0,
            UrgencyLevel.HIGH: 15.0,
            UrgencyLevel.MEDIUM: 5.0,
            UrgencyLevel.LOW: 0.0,
        }
        urg_pts = urgency_points.get(urgency, 5.0)
        score += urg_pts

        # 4. Wait time penalty
        wait_penalty = min(wait_time_minutes * 0.5, 15.0)
        score -= wait_penalty

        score = max(5.0, min(99.0, score))

        return {
            "score": round(score, 1),
            "distance_km": round(distance_km, 1),
            "availability_factor": "Immediately Available" if is_available else "Standby / Busy",
            "urgency_factor": f"User-stated urgency: {urgency.value}",
            "wait_time_factor": f"Estimated wait: ~{wait_time_minutes} mins",
            "disclaimer": "Operational resource ranking based on proximity and operational availability. Not a clinical or medical priority assessment.",
        }


ml_service = OperationalMLService()
