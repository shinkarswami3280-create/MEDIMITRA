# ============================================================
# MediMitra — Dockerfile
# Builds: Python 3.11 FastAPI backend + React static assets
# Target: Google Cloud Run (listens on $PORT)
# ============================================================

FROM python:3.11-slim AS backend-deps

WORKDIR /app

# Install system build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ============================================================
# Final image
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from build stage
COPY --from=backend-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-deps /usr/local/bin /usr/local/bin

# Copy backend source
COPY backend/ ./backend/

# Copy pre-built React static files (run `npm run build` in frontend/ first)
COPY frontend/dist/ ./static/

# Environment
ENV PYTHONPATH=/app
ENV APP_ENV=production

# Cloud Run injects $PORT; default to 8080
ENV PORT=8080
EXPOSE 8080

# Entrypoint — Cloud Run passes PORT via environment variable
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}
