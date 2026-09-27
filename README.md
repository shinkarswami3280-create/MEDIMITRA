# MediMitra — Healthcare Coordination Platform

> **Tagline:** *"One request. The right connection."*  
> **Solo 4-Hour Hackathon MVP** · FIT FEST 2026 · Target Deployment: **Google Cloud Run**

---

## 📌 1. Overview & Problem Statement

Small medical clinics and local healthcare facilities often operate on fragmented phone calls, physical notebooks, disconnected WhatsApp groups, and spreadsheets. When a patient faces a critical situation—seeking an ambulance, blood units, or immediate clinical booking—information fragmentation adds fear, latency, and panic.

**MediMitra** bridges this gap by unifying:
1. **Patient Appointments** with instant clinic synchronization.
2. **Emergency Ambulance Dispatch** using Haversine distance and live GPS tracking.
3. **Two-Tier Blood Coordination** combining verified public blood banks (eRaktKosh) with privacy-protected voluntary donors.
4. **Healthcare Assistance Hub** with dynamically editable, source-attributed government schemes.
5. **Simulated WhatsApp & Voice Assistants** with a strict medical question refusal guardrail.

---

## 🛡️ 2. Non-Negotiable Safety & Scope Rules

- **Administrative & Coordination Only:** MediMitra NEVER provides medical diagnosis, treatment recommendations, or clinical decision-making.
- **Operational Ranking, Never "Triage":** Algorithms score operational variables (distance, reported availability, stated urgency, wait times) for dispatch logistics and are explicitly disclaimed as non-clinical.
- **Medical Inquiry Refusal:** When asked for medical advice, the AI assistant responds with the mandatory refusal:
  > *"I can help with healthcare coordination, appointments and service information, but I cannot provide medical diagnosis or treatment advice."*
- **Privacy Enforcement:** Voluntary donor phone numbers are **never publicly exposed**; contact is released only when the donor approves a specific consent request.
- **Verified Public Sources:** Institutional blood bank details and government schemes cite their source URLs and last-verified timestamps.

---

## 🚀 3. Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.11/3.12, FastAPI, SQLAlchemy ORM, Pydantic v2, native bcrypt, python-jose |
| **Database** | SQLite (development/demo) with PostgreSQL-compatible ORM schema |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Leaflet / OpenStreetMap |
| **ML Module** | Operational no-show risk indicator, statistical booking demand forecast, resource priority ranking |
| **Assistants** | Simulated interactive WhatsApp chat and voice call consoles (zero API keys needed) + optional Twilio adapters |
| **Export** | 1-click CSV download (always works) + optional Google Sheets export via `gspread` |
| **Deployment** | Docker container configured to listen on `$PORT` for Google Cloud Run |

---

## 🔑 4. One-Click Demo Mode Credentials

The login screen features **3 one-click demo buttons** that drop straight into fully-seeded, realistic accounts with zero typing required:

| Role | Name | Demo Phone | Password | Seeded Context |
|---|---|---|---|---|
| **Patient** | Arjun Mehta | `9000000003` | `demo1234` | Upcoming cardiology checkup, active ambulance dispatch en-route, O+ blood request |
| **Hospital Staff** | Dr. Priya Verma | `9000000002` | `demo1234` | Kokilaben Hospital command center, live incoming dispatches, appointment queue |
| **Admin** | Admin Sharma | `9000000001` | `demo1234` | System-wide counts, live scheme editor, complete audit logs |

---

## ⚡ 5. Quick Start (Local Setup)

### Prerequisites
- Python 3.11+ / 3.12 (`uv` recommended)
- Node.js 18+ and npm

### 1. Setup Backend
```bash
# Create virtual environment and install dependencies
uv venv --python 3.12 .venv
.venv\Scripts\activate          # On Windows
# source .venv/bin/activate     # On Linux / Mac

uv pip install -r backend/requirements.txt

# Seed the demonstration database (Hospitals, Blood Banks, Schemes, Users)
python -m backend.seed

# Start FastAPI backend server
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run build      # Produces optimized production bundle in frontend/dist
npm run dev        # Optional: Runs local dev server on http://localhost:5173
```

> **Unified Service:** The FastAPI backend serves the built React application directly at `http://127.0.0.1:8000/`.

---

## 📡 6. Core API Endpoints

- `GET /health` — Service health and demo status
- `POST /api/auth/demo-login/{role}` — 1-click token generation for `patient`, `hospital_staff`, `admin`
- `GET /api/appointments/slots` — Live department slot capacity
- `POST /api/appointments` — Book slot (instantly syncs with hospital queue)
- `POST /api/ambulance/request` — Haversine nearest-ambulance match & dispatch
- `GET /api/blood/match` — Two-tier matching (eRaktKosh banks + consent-gated donors)
- `GET /api/schemes` — Verified government schemes with source links
- `PUT /api/schemes/{id}` — Admin live database update for schemes
- `GET /api/hospital/command-center` — Live emergency queue and wait times
- `GET /api/hospital/export/appointments/csv` — Direct CSV download
- `POST /api/assistant/chat` — Simulated WhatsApp coordination with medical refusal guard
- `GET /api/ml/no-show-risk/{id}` — Operational scheduling risk assessment

---

## 🐳 7. Docker & Google Cloud Run Deployment

### Docker Build & Run
```bash
# Build unified container image
docker build -t medimitra:latest .

# Run container locally
docker run -p 8080:8080 -e PORT=8080 medimitra:latest
```

### Google Cloud Run Deploy Command
```bash
gcloud run deploy medimitra \
  --image gcr.io/<PROJECT_ID>/medimitra:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080
```

---

## 📄 License & Hackathon Notice

Built for the **FIT FEST 2026 Solo 4-Hour Hackathon Challenge**. Designed strictly for operational logistics and healthcare coordination without clinical diagnosis or medical treatment advice.
