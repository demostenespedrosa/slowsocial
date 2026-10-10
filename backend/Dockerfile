# =========================================================================
# DOCKERFILE: SLOWSOCIAL API GATEWAY (Context: backend/)
# Multi-stage build otimizado para produção (<30MB)
# =========================================================================

# Estágio 1: Compilação
FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates git

# Cache de dependências Go
COPY go.mod go.sum* ./
RUN go mod download || true

# Copiar código fonte
COPY . ./

# Garantir dependências e gerar go.sum automaticamente
RUN go mod tidy

# Compilação estática com CGO desabilitado
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/api ./cmd/api

# Estágio 2: Imagem Final Leve e Segura
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

# Copiar binário compilado
COPY --from=builder /app/bin/api /app/api

EXPOSE 8080

USER nobody:nobody

ENTRYPOINT ["/app/api"]
