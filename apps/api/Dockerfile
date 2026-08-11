FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies untuk build (psycopg2, tokenizers, dll)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dan install dependencies dulu (layer caching)
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt

    
FROM python:3.12-slim AS runtime

WORKDIR /app

# Install runtime system deps saja (lebih kecil dari builder)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages dari builder
COPY --from=builder /install /usr/local

# Copy source code
COPY ./app ./app

# User non-root untuk keamanan
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port FastAPI
EXPOSE 8000

# Health check (nyambung sama endpoint /health di main.py-mu)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Jalankan uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
