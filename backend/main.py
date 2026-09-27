"""
MediMitra — FastAPI Backend Application
Main entry point for healthcare coordination platform.
Serves both the REST API (/api/*) and the React Frontend SPA (/*).
"""
from contextlib import asynccontextmanager
from pathlib import Path
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import engine, Base
from backend.core.config import settings

# Import all models to ensure registered on Base
import backend.models

# Routers
from backend.routers.auth_router import router as auth_router
from backend.routers.appointments_router import router as appointments_router
from backend.routers.ambulance_router import router as ambulance_router
from backend.routers.blood_router import router as blood_router
from backend.routers.misc_routers import (
    patients_router,
    hospitals_router,
    notifications_router,
    schemes_router,
    documents_router,
)
from backend.routers.hospital_router import router as hospital_router
from backend.routers.admin_router import router as admin_router
from backend.routers.ml_router import router as ml_router
from backend.routers.assistant_router import router as assistant_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="MediMitra API",
    description="One request. The right connection. Healthcare coordination platform for clinics, ambulances, blood, and emergency resources.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "MediMitra API",
        "demo_mode": settings.DEMO_MODE,
        "database": "connected",
        "tagline": "One request. The right connection.",
    }


@app.get("/api/info", tags=["Root"])
def api_info():
    return {
        "message": "Welcome to MediMitra Healthcare Coordination API",
        "docs_url": "/docs",
        "health_url": "/health",
        "scope_notice": "Administrative and resource coordination only. Does not provide clinical diagnosis or medical treatment.",
    }


# Mount Routers
app.include_router(auth_router)
app.include_router(appointments_router)
app.include_router(ambulance_router)
app.include_router(blood_router)
app.include_router(patients_router)
app.include_router(hospitals_router)
app.include_router(notifications_router)
app.include_router(schemes_router)
app.include_router(documents_router)
app.include_router(hospital_router)
app.include_router(admin_router)
app.include_router(ml_router)
app.include_router(assistant_router)

# ─── Serve React Single Page Application (SPA) ───
ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "frontend" / "dist"
STATIC_DIR = ROOT_DIR / "static"

dist_path = DIST_DIR if DIST_DIR.exists() else (STATIC_DIR if STATIC_DIR.exists() else None)

if dist_path and dist_path.exists():
    # Mount assets folder
    assets_dir = dist_path / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API / docs routes should already be handled by their routers above.
        # This catch-all only handles frontend SPA navigation paths.
        # If somehow an /api/ path reaches here, return a proper 404 JSON.
        if (
            full_path.startswith("api/")
            or full_path == "api"
            or full_path.startswith("docs")
            or full_path.startswith("openapi.json")
            or full_path.startswith("redoc")
        ):
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=404,
                content={"detail": f"API endpoint not found: /{full_path}"},
            )

        # Serve static file if it exists (e.g. favicon.svg, manifest.json)
        target_file = dist_path / full_path
        if target_file.is_file():
            return FileResponse(target_file)

        # Fallback: always return index.html for client-side routing
        return FileResponse(dist_path / "index.html")
