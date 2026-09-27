# ============================================================
# MediMitra — Bulletproof Multi-Stage Dockerfile
# Builds: React SPA (Node 20) + FastAPI backend (Python 3.11)
# Deployable to: Render, Google Cloud Run, Railway, AWS ECS
# ============================================================

# ── Stage 1: Build Frontend ──
FROM node:20-slim AS frontend-builder

WORKDIR /frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and compile production assets
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Install Backend Dependencies ──
FROM python:3.11-slim AS backend-deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 3: Final Production Image ──
FROM python:3.11-slim

WORKDIR /app

# Copy Python packages
COPY --from=backend-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-deps /usr/local/bin /usr/local/bin

# Copy backend source
COPY backend/ ./backend/

# Copy compiled frontend from Stage 1 to both static locations
COPY --from=frontend-builder /frontend/dist/ ./static/
COPY --from=frontend-builder /frontend/dist/ ./frontend/dist/

# Copy seed database if present
COPY medimitra.db* ./

# Environment
ENV PYTHONPATH=/app
ENV APP_ENV=production
ENV PORT=8080
EXPOSE 8080

# Auto-seed if database is unseeded, then run FastAPI server
CMD sh -c "python -m backend.seed || true; uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"
