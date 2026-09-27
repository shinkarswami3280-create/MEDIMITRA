"""
MediMitra — Export Service
Exports operational queues and records to CSV (always works)
and optional Google Sheets via gspread (gracefully skips if no credentials).
Database remains the sole source of truth.
"""
import io
import csv
import logging
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from backend.models import Appointment, AmbulanceRequest, BloodRequest
from backend.core.config import settings

logger = logging.getLogger("medimitra.export")


class ExportService:
    @staticmethod
    def export_appointments_csv(db: Session, hospital_id: int) -> str:
        """Generates CSV string of hospital appointments."""
        appts = db.query(Appointment).filter(Appointment.hospital_id == hospital_id).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Patient Name", "Phone", "Service", "Slot Time", "Status", "Source", "Created At"])
        for a in appts:
            p_name = a.patient.name if a.patient else "Unknown"
            p_phone = a.patient.phone if a.patient else ""
            writer.writerow([
                a.id, p_name, p_phone, a.service,
                a.slot_time.strftime("%Y-%m-%d %H:%M"),
                a.status.value, a.source or "web",
                a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "",
            ])
        return output.getvalue()

    @staticmethod
    def export_ambulance_requests_csv(db: Session) -> str:
        """Generates CSV string of ambulance requests."""
        requests = db.query(AmbulanceRequest).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Patient ID", "Pickup Address", "Urgency", "Status", "ETA (mins)", "Created At"])
        for r in requests:
            writer.writerow([
                r.id, r.patient_id, r.pickup_address or f"{r.pickup_lat},{r.pickup_lng}",
                r.urgency.value, r.status.value, r.eta_minutes or "",
                r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
            ])
        return output.getvalue()

    @staticmethod
    def sync_to_google_sheets(sheet_name: str, rows: List[List[Any]]) -> Tuple[bool, str]:
        """
        Mirror export to Google Sheets if credentials configured.
        Gracefully returns warning message if not configured.
        """
        if not settings.sheets_enabled:
            return False, "Google Sheets credentials not configured. Downloaded as direct CSV instead."

        try:
            import gspread
            from google.oauth2.service_account import Credentials
            import json

            creds_dict = json.loads(settings.GOOGLE_SHEETS_CREDENTIALS_JSON)
            scopes = ["https://www.googleapis.com/auth/spreadsheets"]
            credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
            client = gspread.authorize(credentials)
            sheet = client.open_by_key(settings.GOOGLE_SHEETS_SPREADSHEET_ID)

            try:
                worksheet = sheet.worksheet(sheet_name)
            except gspread.WorksheetNotFound:
                worksheet = sheet.add_worksheet(title=sheet_name, rows="100", cols="20")

            worksheet.clear()
            worksheet.update(rows)
            return True, f"Successfully exported {len(rows)} rows to Google Sheets ({sheet_name})."
        except Exception as e:
            logger.warning(f"Google Sheets sync failed: {e}")
            return False, f"Google Sheets sync error: {str(e)}"


export_service = ExportService()
