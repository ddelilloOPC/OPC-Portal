# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

# Copy frontend source + shared messages
COPY frontend/ ./frontend/
COPY messages/ ./messages/

# Ensure backend dist folder exists
RUN mkdir -p backend/app/static/dist

# Build frontend
RUN cd frontend && npm run build


# ── Stage 2: Python runtime ───────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/run.py ./
COPY backend/app/ ./app/

# Copy built frontend from builder
COPY --from=builder /build/backend/app/static/dist ./app/static/dist

# Create session folder
RUN mkdir -p flask_session

EXPOSE 8000

CMD ["uvicorn", "run:app", "--host", "0.0.0.0", "--port", "8000"]