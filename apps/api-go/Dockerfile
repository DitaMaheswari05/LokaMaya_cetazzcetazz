# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

WORKDIR /app

ENV GOTOOLCHAIN=auto

# Install git untuk go mod download & tidy
RUN apk add --no-cache git

# Copy file dependensi terlebih dahulu agar di-cache oleh Docker
COPY go.mod go.sum ./
RUN go mod download

# Copy seluruh source code
COPY . .

# Pastikan checksum go.sum tersinkronisasi
RUN go mod tidy

# Build binary statik — CGO_ENABLED=0 agar tidak butuh libc di runtime
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /api ./cmd/server

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM alpine:3.20 AS runtime

WORKDIR /app

# Hanya tambahkan ca-certificates untuk HTTPS outbound calls
RUN apk add --no-cache ca-certificates tzdata

# Copy binary dari builder
COPY --from=builder /api /app/api

# User non-root untuk keamanan
RUN adduser -D -u 1000 appuser
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["/app/api"]
