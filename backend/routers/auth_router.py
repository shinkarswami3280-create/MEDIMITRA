"""
MediMitra — Auth Router
POST /api/auth/register
POST /api/auth/login
POST /api/auth/demo-login/{role}
GET  /api/auth/me
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Patient, User, UserRole, HospitalStaff
from backend.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from backend.core.security import create_access_token, hash_password, verify_password
from backend.core.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

DEMO_PHONES = {
    "patient": "9000000003",
    "hospital_staff": "9000000002",
    "admin": "9000000001",
}


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.phone == req.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user = User(
        phone=req.phone,
        password_hash=hash_password(req.password),
        role=req.role,
        name=req.name,
    )
    db.add(user)
    db.flush()

    # Auto-create patient profile
    if req.role == UserRole.patient:
        patient = Patient(
            user_id=user.id,
            name=req.name,
            phone=req.phone,
        )
        db.add(patient)

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name,
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name,
    )


@router.post("/demo-login/{role}", response_model=TokenResponse)
def demo_login(role: str, db: Session = Depends(get_db)):
    """One-click demo login — no password required. For hackathon demo only."""
    phone = DEMO_PHONES.get(role)
    if not phone:
        raise HTTPException(status_code=400, detail=f"Unknown demo role: {role}")

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(
            status_code=503,
            detail="Demo data not seeded. Run: python -m backend.seed",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
