# ---- Frontend build stage ----
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
# npm ci refuses here: package-lock.json pins Windows-specific optional
# native deps (Tailwind's oxide engine) from being generated on a Windows
# host; npm install resolves the Linux equivalents instead.
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Backend runtime stage ----
FROM python:3.12-slim AS runtime
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

COPY backend/app ./app
RUN uv sync --locked --no-dev

COPY --from=frontend-build /app/frontend/out /app/frontend/out

ENV DATABASE_DIR=/app/backend/data
EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
