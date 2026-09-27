"""
MediMitra — Assistant Service (WhatsApp & Voice Coordination Engine)
Administrative assistance with strict medical question refusal safeguard.
Intents supported:
- BOOK (appointment booking coordination)
- STATUS (check status of appointment/ambulance/blood request)
- CANCEL (cancel appointment or request)
- RESCHEDULE (reschedule appointment)
- BLOOD (blood bank and donor matching coordination)
- EMERGENCY (ambulance and emergency dispatch)
- HELP (general operational menu)

MANDATORY MEDICAL REFUSAL:
"I can help with healthcare coordination, appointments and service information, but I cannot provide medical diagnosis or treatment advice."
"""
import re
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.models import (
    Appointment, AppointmentStatus, AmbulanceRequest,
    BloodRequest, Patient, User
)


class AssistantService:
    # Exact non-negotiable medical refusal line from specification
    MEDICAL_REFUSAL_MESSAGE = (
        "I can help with healthcare coordination, appointments and service information, "
        "but I cannot provide medical diagnosis or treatment advice."
    )

    # Trigger words for medical inquiries (symptoms, medication, medical diagnosis)
    MEDICAL_KEYWORDS = [
        "headache", "fever", "pain", "chest pain", "vomiting", "cough", "infection",
        "medicine", "tablet", "dosage", "prescribe", "diagnosis", "disease", "treatment",
        "cure", "cancer", "diabetes", "bp", "blood pressure", "symptom", "doctor advice",
        "dizziness", "rash", "allergy", "antibiotic", "what should i take"
    ]

    @classmethod
    def process_message(
        cls,
        text: str,
        user_phone: Optional[str] = None,
        channel: str = "whatsapp",
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Parses intent and returns coordination response.
        Enforces medical advice refusal first.
        """
        cleaned = text.strip().lower()

        # Step 1: Mandatory Medical Refusal Check
        for kw in cls.MEDICAL_KEYWORDS:
            if re.search(r"\b" + re.escape(kw) + r"\b", cleaned):
                return {
                    "intent": "MEDICAL_REFUSAL",
                    "response": cls.MEDICAL_REFUSAL_MESSAGE,
                    "action_taken": "REFUSED_MEDICAL_ADVICE",
                    "is_simulated": True,
                }

        # Step 2: Emergency / Ambulance Intent
        if any(w in cleaned for w in ["emergency", "ambulance", "108", "urgent pickup", "accident"]):
            return {
                "intent": "EMERGENCY",
                "response": (
                    "🚨 MediMitra Emergency Coordination:\n"
                    "Nearest ambulances are available on standby.\n"
                    "To dispatch an ambulance immediately, please confirm your pickup location "
                    "or tap 'Emergency Dispatch' in your MediMitra portal. Direct emergency contact: 108."
                ),
                "action_taken": "EMERGENCY_DISPATCH_PROMPT",
                "is_simulated": True,
            }

        # Step 3: Blood Coordination Intent
        if any(w in cleaned for w in ["blood", "platelets", "plasma", "donor", "rakt"]):
            blood_groups = ["a+", "a-", "b+", "b-", "ab+", "ab-", "o+", "o-"]
            found_bg = next((bg.upper() for bg in blood_groups if bg in cleaned), "your required blood group")
            return {
                "intent": "BLOOD",
                "response": (
                    f"🩸 Blood Coordination Assistance:\n"
                    f"Searching verified institutional blood banks on eRaktKosh for {found_bg}.\n"
                    "We have institutional banks with public contact details and registered voluntary donors ready for request."
                ),
                "action_taken": "BLOOD_MATCH_INITIATED",
                "is_simulated": True,
            }

        # Step 4: Status Intent
        if any(w in cleaned for w in ["status", "check", "track", "my request", "my booking"]):
            # Check DB if phone provided
            detail = "You have an active appointment scheduled at City General Hospital."
            if db and user_phone:
                patient = db.query(Patient).filter(Patient.phone == user_phone).first()
                if patient:
                    appt = db.query(Appointment).filter(
                        Appointment.patient_id == patient.id,
                        Appointment.status.in_([AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED])
                    ).first()
                    if appt:
                        detail = f"Active Appointment: {appt.service} on {appt.slot_time.strftime('%b %d at %I:%M %p')} (Status: {appt.status.value})"

            return {
                "intent": "STATUS",
                "response": f"📋 Status Update:\n{detail}",
                "action_taken": "STATUS_LOOKUP",
                "is_simulated": True,
            }

        # Step 5: Cancel Intent
        if any(w in cleaned for w in ["cancel", "cancel appointment", "dismiss"]):
            return {
                "intent": "CANCEL",
                "response": "Your appointment cancellation request has been noted. Please open the appointments tab to confirm cancellation or manage details.",
                "action_taken": "CANCEL_PROMPT",
                "is_simulated": True,
            }

        # Step 6: Reschedule Intent
        if any(w in cleaned for w in ["reschedule", "change time", "change date", "postpone"]):
            return {
                "intent": "RESCHEDULE",
                "response": "To reschedule your appointment, available slots are open for tomorrow from 10:00 AM onwards at your booked clinic.",
                "action_taken": "RESCHEDULE_PROMPT",
                "is_simulated": True,
            }

        # Step 7: Book Intent
        if any(w in cleaned for w in ["book", "appointment", "schedule", "visit"]):
            return {
                "intent": "BOOK",
                "response": (
                    "📅 Appointment Booking:\n"
                    "Please state the hospital name or service you need (e.g., General OPD, Pediatrics, Cardiology).\n"
                    "You can also book directly in 1 click from your patient dashboard."
                ),
                "action_taken": "BOOKING_COORDINATION",
                "is_simulated": True,
            }

        # Fallback / General Help
        return {
            "intent": "HELP",
            "response": (
                "👋 Namaste! I am your MediMitra healthcare coordination assistant.\n"
                "I can assist you with:\n"
                "1. Book Appointment (type 'book')\n"
                "2. Check Request Status (type 'status')\n"
                "3. Find Blood / Blood Banks (type 'blood')\n"
                "4. Request Ambulance (type 'ambulance')\n"
                "5. Reschedule or Cancel\n\n"
                "Note: MediMitra provides administrative coordination and does not provide medical diagnosis or treatment."
            ),
            "action_taken": "HELP_MENU",
            "is_simulated": True,
        }


assistant_service = AssistantService()
