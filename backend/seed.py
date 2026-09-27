"""
MediMitra — Database Seeder
Seeds real Pune + Mumbai hospitals, blood banks, 30 donors, ambulances, schemes,
users, appointments, and notifications.
Run once:  python -m backend.seed
"""
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
import random

from sqlalchemy.orm import Session

# Ensure UTF-8 output on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database import SessionLocal, engine, Base
from backend.models import (
    Ambulance, AmbulanceRequest, AmbulanceRequestStatus, AmbulanceStatus,
    Appointment, AppointmentSlot, AppointmentStatus,
    BloodRequest, BloodRequestStatus, BloodResource, BloodResourceType,
    Document, Donor, DonorConsentRequest, DonorConsentStatus,
    FinancialAssistance, GovernmentScheme,
    Hospital, HospitalStaff,
    Notification, NotificationChannel,
    Patient, UrgencyLevel, User, UserRole,
)
from backend.core.security import hash_password

SEED_DIR = Path(__file__).parent / "seed_data"


def load_json(filename: str) -> list:
    with open(SEED_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def seed_hospitals(db: Session) -> list[Hospital]:
    data = load_json("hospitals.json")
    hospitals = []
    for h in data:
        hospital = Hospital(
            name=h["name"],
            address=h["address"],
            lat=h["lat"],
            lng=h["lng"],
            services=json.dumps(h["services"]),
        )
        db.add(hospital)
        hospitals.append(hospital)
    db.flush()
    print(f"  ✓ Seeded {len(hospitals)} hospitals (Pune + Mumbai)")
    return hospitals


def seed_blood_resources(db: Session):
    data = load_json("blood_resources.json")
    for b in data:
        resource = BloodResource(
            name=b["name"],
            type=BloodResourceType(b["type"]),
            district=b.get("district"),
            address=b.get("address"),
            phone=b.get("phone"),
            lat=b.get("lat"),
            lng=b.get("lng"),
            last_verified=b.get("last_verified"),
            source_url=b.get("source_url", "https://eraktkosh.in"),
        )
        db.add(resource)
    db.flush()
    print(f"  ✓ Seeded {len(data)} blood banks")


def seed_schemes(db: Session):
    data = load_json("schemes.json")
    for s in data:
        scheme = GovernmentScheme(
            name=s["name"],
            state=s["state"],
            description=s.get("description"),
            eligibility=s.get("eligibility"),
            documents=s.get("documents"),
            official_website=s.get("official_website"),
            official_contact=s.get("official_contact"),
            source=s.get("source"),
            last_verified=s.get("last_verified"),
        )
        db.add(scheme)
    db.flush()

    partners = [
        FinancialAssistance(
            partner_name="iCall – Tata Institute of Social Sciences",
            description="Low-cost counselling and mental health support.",
            eligibility="Open to all. Sliding scale fees.",
            external_link="https://icallhelpline.org",
        ),
        FinancialAssistance(
            partner_name="Milaap Medical Crowdfunding",
            description="Raise funds for medical emergencies via crowdfunding.",
            eligibility="Open to all patients needing financial assistance.",
            external_link="https://milaap.org",
        ),
        FinancialAssistance(
            partner_name="HelpAge India",
            description="Financial aid and healthcare support for senior citizens.",
            eligibility="Senior citizens aged 60+.",
            external_link="https://www.helpageindia.org",
        ),
    ]
    for p in partners:
        db.add(p)
    db.flush()
    print(f"  ✓ Seeded {len(data)} schemes + {len(partners)} financial partners")


def seed_users_and_demo_data(db: Session, hospitals: list[Hospital]):
    now = datetime.utcnow()

    # ─── Admin ───────────────────────────────────────────────
    admin_user = User(phone="9000000001", password_hash=hash_password("demo1234"),
                      role=UserRole.admin, name="Admin Sharma")
    db.add(admin_user)
    db.flush()

    # ─── Hospital Staff (Sassoon General, Pune) ──────────────
    staff_user = User(phone="9000000002", password_hash=hash_password("demo1234"),
                      role=UserRole.hospital_staff, name="Dr. Priya Verma")
    db.add(staff_user)
    db.flush()

    # Staff at Sassoon (index 0 = Sassoon General)
    sassoon = hospitals[0]
    ruby_hall = hospitals[1]
    jehangir = hospitals[2]
    deenanath = hospitals[4]
    kokilaben = hospitals[10]
    kem_mumbai = hospitals[11]

    db.add(HospitalStaff(user_id=staff_user.id, hospital_id=sassoon.id))
    db.flush()

    # ─── Primary Patient ─────────────────────────────────────
    patient_user = User(phone="9000000003", password_hash=hash_password("demo1234"),
                        role=UserRole.patient, name="Arjun Mehta")
    db.add(patient_user)
    db.flush()

    patient = Patient(user_id=patient_user.id, name="Arjun Mehta", age=34,
                      gender="Male", phone="9000000003", blood_group="O+",
                      address="Flat 302, Sunrise Apartments, Kothrud, Pune - 411038")
    db.add(patient)
    db.flush()

    # ─── Second Patient (also a donor) ───────────────────────
    patient_user2 = User(phone="9000000004", password_hash=hash_password("demo1234"),
                         role=UserRole.patient, name="Sneha Joshi")
    db.add(patient_user2)
    db.flush()

    patient2 = Patient(user_id=patient_user2.id, name="Sneha Joshi", age=28,
                       gender="Female", phone="9000000004", blood_group="A+",
                       address="15, FC Road, Shivajinagar, Pune - 411016")
    db.add(patient2)
    db.flush()

    # ─── Third Patient ────────────────────────────────────────
    patient_user3 = User(phone="9000000005", password_hash=hash_password("demo1234"),
                         role=UserRole.patient, name="Ravi Kulkarni")
    db.add(patient_user3)
    db.flush()

    patient3 = Patient(user_id=patient_user3.id, name="Ravi Kulkarni", age=52,
                       gender="Male", phone="9000000005", blood_group="B+",
                       address="Viman Nagar, Pune - 411014")
    db.add(patient3)
    db.flush()

    # ─── Seed 30 Donors from donors.json ─────────────────────
    donors_data = load_json("donors.json")
    # Make patient2 (Sneha) the first donor
    first_donor = Donor(patient_id=patient2.id, name="Sneha J.", blood_group="A+",
                        general_area="Shivajinagar, Pune", consent_flag=True,
                        last_active=now - timedelta(days=30))
    db.add(first_donor)
    db.flush()

    # Remaining standalone donors (no user account — just donor records with names)
    extra_donors = []
    for d in donors_data:
        # Show first name + last initial only for privacy
        parts = d["name"].split()
        display_name = f"{parts[0]} {parts[-1][0]}." if len(parts) > 1 else parts[0]
        donor = Donor(
            patient_id=None,
            name=display_name,
            blood_group=d["blood_group"],
            general_area=d["general_area"],
            consent_flag=True,
            last_active=now - timedelta(days=d["last_donated_days_ago"]),
        )
        db.add(donor)
        extra_donors.append(donor)
    db.flush()
    print(f"  ✓ Seeded {1 + len(extra_donors)} donors across Pune & Mumbai")

    # ─── Appointment Slots ───────────────────────────────────
    services_by_hospital = {
        sassoon.id: ["Emergency", "General Medicine", "Surgery", "Orthopedics"],
        ruby_hall.id: ["Cardiology", "Neurology", "Oncology", "ICU"],
        jehangir.id: ["Cardiology", "Gastroenterology", "Robotic Surgery"],
        deenanath.id: ["Cancer Care", "Pediatrics", "General Medicine"],
        kokilaben.id: ["Cardiology", "Neurology", "Oncology", "Emergency"],
        kem_mumbai.id: ["Emergency", "General Medicine", "Surgery"],
    }

    all_slots = []
    for hosp_id, svcs in services_by_hospital.items():
        for day_offset in range(1, 8):
            for hour in [9, 11, 14, 16]:
                for svc in svcs[:2]:
                    slot = AppointmentSlot(
                        hospital_id=hosp_id, service=svc,
                        slot_datetime=now.replace(hour=hour, minute=0, second=0) + timedelta(days=day_offset),
                        capacity=8, booked=random.randint(0, 4),
                    )
                    db.add(slot)
                    all_slots.append(slot)
    db.flush()

    # ─── Demo Appointments ────────────────────────────────────
    upcoming_slot = all_slots[0]
    upcoming_slot.booked = (upcoming_slot.booked or 0) + 1

    db.add(Appointment(patient_id=patient.id, hospital_id=sassoon.id, slot_id=upcoming_slot.id,
                       service="General Medicine", slot_time=upcoming_slot.slot_datetime,
                       status=AppointmentStatus.CONFIRMED, source="web", notes="Routine check-up"))

    db.add(Appointment(patient_id=patient.id, hospital_id=ruby_hall.id, slot_id=None,
                       service="Cardiology", slot_time=now - timedelta(days=20),
                       status=AppointmentStatus.COMPLETED, source="web"))

    db.add(Appointment(patient_id=patient3.id, hospital_id=jehangir.id, slot_id=all_slots[8].id,
                       service="Cardiology", slot_time=all_slots[8].slot_datetime,
                       status=AppointmentStatus.CONFIRMED, source="web", notes="ECG follow-up"))
    db.flush()

    # ─── Ambulances (Pune + Mumbai fleet) ────────────────────
    ambulance_data = [
        # Sassoon General – Pune
        {"hospital_id": sassoon.id, "driver_name": "Ramesh Patil", "phone": "9876500001",
         "vehicle_number": "MH12-AA-1001", "lat": 18.5220, "lng": 73.8570, "status": AmbulanceStatus.AVAILABLE},
        {"hospital_id": sassoon.id, "driver_name": "Suresh Mane", "phone": "9876500002",
         "vehicle_number": "MH12-AA-1002", "lat": 18.5190, "lng": 73.8510, "status": AmbulanceStatus.AVAILABLE},
        {"hospital_id": sassoon.id, "driver_name": "Ganesh Shinde", "phone": "9876500003",
         "vehicle_number": "MH12-AA-1003", "lat": 18.5250, "lng": 73.8600, "status": AmbulanceStatus.DISPATCHED},
        # Ruby Hall – Pune
        {"hospital_id": ruby_hall.id, "driver_name": "Anil Jadhav", "phone": "9876500004",
         "vehicle_number": "MH12-BB-2001", "lat": 18.5350, "lng": 73.8760, "status": AmbulanceStatus.AVAILABLE},
        {"hospital_id": ruby_hall.id, "driver_name": "Vinod Bhosale", "phone": "9876500005",
         "vehicle_number": "MH12-BB-2002", "lat": 18.5320, "lng": 73.8720, "status": AmbulanceStatus.AVAILABLE},
        # Jehangir – Pune
        {"hospital_id": jehangir.id, "driver_name": "Prakash More", "phone": "9876500006",
         "vehicle_number": "MH12-CC-3001", "lat": 18.5300, "lng": 73.8790, "status": AmbulanceStatus.AVAILABLE},
        # Deenanath – Pune
        {"hospital_id": deenanath.id, "driver_name": "Santosh Desai", "phone": "9876500007",
         "vehicle_number": "MH12-DD-4001", "lat": 18.5080, "lng": 73.8220, "status": AmbulanceStatus.AVAILABLE},
        {"hospital_id": deenanath.id, "driver_name": "Milind Kadam", "phone": "9876500008",
         "vehicle_number": "MH12-DD-4002", "lat": 18.5100, "lng": 73.8250, "status": AmbulanceStatus.AVAILABLE},
        # Kokilaben – Mumbai
        {"hospital_id": kokilaben.id, "driver_name": "Raju Yadav", "phone": "9876500009",
         "vehicle_number": "MH01-EE-5001", "lat": 19.1200, "lng": 72.8470, "status": AmbulanceStatus.AVAILABLE},
        {"hospital_id": kokilaben.id, "driver_name": "Vijay Kumar", "phone": "9876500010",
         "vehicle_number": "MH01-EE-5002", "lat": 19.1180, "lng": 72.8450, "status": AmbulanceStatus.AVAILABLE},
        # KEM Mumbai
        {"hospital_id": kem_mumbai.id, "driver_name": "Mohan Tiwari", "phone": "9876500011",
         "vehicle_number": "MH01-FF-6001", "lat": 19.0030, "lng": 72.8430, "status": AmbulanceStatus.AVAILABLE},
    ]

    ambulances = []
    for a in ambulance_data:
        amb = Ambulance(**a)
        db.add(amb)
        ambulances.append(amb)
    db.flush()

    # ─── Demo: Ambulance Request (dispatched, Arjun) ──────────
    db.add(AmbulanceRequest(
        patient_id=patient.id,
        pickup_lat=18.5074, pickup_lng=73.8077,
        pickup_address="Kothrud, near Vanaz Metro, Pune",
        destination_hospital_id=sassoon.id,
        urgency=UrgencyLevel.HIGH,
        status=AmbulanceRequestStatus.DISPATCHED,
        ambulance_id=ambulances[2].id,  # Ganesh Shinde (already DISPATCHED)
        patient_contact="9000000003",
        eta_minutes=7,
        created_at=now - timedelta(minutes=10),
    ))
    db.flush()

    # ─── Demo: Blood Request ──────────────────────────────────
    blood_req = BloodRequest(
        patient_id=patient.id,
        blood_group="O+",
        location="Kothrud, Pune",
        location_lat=18.5074,
        location_lng=73.8077,
        units=2,
        urgency=UrgencyLevel.HIGH,
        status=BloodRequestStatus.OPEN,
        notes="Pre-surgery requirement at Deenanath Mangeshkar Hospital",
    )
    db.add(blood_req)
    db.flush()

    db.add(DonorConsentRequest(
        donor_id=first_donor.id,
        blood_request_id=blood_req.id,
        status=DonorConsentStatus.PENDING,
    ))
    db.flush()

    # ─── Demo Documents ───────────────────────────────────────
    docs = [
        {"type": "bill", "filename": "Sassoon_OPD_Invoice_Mar2024.pdf", "file_size_kb": 48},
        {"type": "prescription", "filename": "Dr_Verma_Prescription_Feb2024.pdf", "file_size_kb": 35},
        {"type": "report", "filename": "CBC_Blood_Report_Jan2024.pdf", "file_size_kb": 112},
        {"type": "discharge", "filename": "Discharge_Summary_RubyHall_Dec2023.pdf", "file_size_kb": 290},
        {"type": "report", "filename": "ECG_Report_Jehangir_Apr2024.pdf", "file_size_kb": 78},
    ]
    for d in docs:
        db.add(Document(patient_id=patient.id, is_demo=True, **d))
    db.flush()

    # ─── Notifications ────────────────────────────────────────
    notifs = [
        Notification(user_id=patient_user.id, channel=NotificationChannel.in_app,
                     title="Appointment Confirmed",
                     message=f"Your General Medicine appointment at Sassoon General Hospital is confirmed for {upcoming_slot.slot_datetime.strftime('%d %b %Y, %I:%M %p')}.",
                     read=False),
        Notification(user_id=patient_user.id, channel=NotificationChannel.in_app,
                     title="Blood Request Active",
                     message="Your O+ blood request is open. Matching with 12 nearby donors and 8 blood banks in Pune.",
                     read=False),
        Notification(user_id=patient_user.id, channel=NotificationChannel.in_app,
                     title="Ambulance Dispatched",
                     message="Ambulance MH12-AA-1003 (Driver: Ganesh Shinde) is en route. ETA: 7 minutes.",
                     read=False),
        Notification(user_id=patient_user.id, channel=NotificationChannel.in_app,
                     title="Donor Match Found",
                     message="A registered O+ donor in Shivajinagar has been notified about your request.",
                     read=True),
        Notification(user_id=staff_user.id, channel=NotificationChannel.in_app,
                     title="Emergency Ambulance Request",
                     message="Patient Arjun Mehta (Kothrud) has an active HIGH urgency ambulance request.",
                     read=False),
        Notification(user_id=staff_user.id, channel=NotificationChannel.in_app,
                     title="Blood Request — O+ Required",
                     message="Urgent O+ blood request from Kothrud. 2 units needed. Please coordinate with blood bank.",
                     read=False),
    ]
    for n in notifs:
        db.add(n)
    db.flush()

    print(f"  ✓ Seeded 5 users (admin / staff / 3 patients)")
    print(f"  ✓ Seeded {len(all_slots)} appointment slots across 6 hospitals")
    print(f"  ✓ Seeded {len(ambulance_data)} ambulances (Pune + Mumbai fleet)")
    print(f"  ✓ Seeded demo ambulance request, blood request, documents, notifications")


def run_seed():
    print("\n🌱 MediMitra — Seeding database with Pune + Mumbai live data...\n")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("  ⚠️  Database already seeded. Delete medimitra.db and re-run to reset.\n")
            return

        hospitals = seed_hospitals(db)
        seed_blood_resources(db)
        seed_schemes(db)
        seed_users_and_demo_data(db, hospitals)

        db.commit()
        print("\n✅ Seed complete!")
        print("   Patient  → phone: 9000000003  password: demo1234")
        print("   Staff    → phone: 9000000002  password: demo1234")
        print("   Admin    → phone: 9000000001  password: demo1234\n")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
