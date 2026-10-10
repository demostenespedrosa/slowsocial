#!/usr/bin/env bash
set -e

echo "=========================================="
echo "   SlowSocial - Local Development Stack    "
echo "=========================================="

# 1. Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "[ERRO] Docker não foi encontrado. Instale o Docker e Docker Compose."
    exit 1
fi

# 2. Subir containers
echo ""
echo "[1/4] Iniciando containers de infraestrutura (PostgreSQL, Redis, Kafka, MinIO, OTel)..."
docker compose -f deploy/docker-compose.yml up -d

# 3. Aguardar PostgreSQL
echo ""
echo "[2/4] Aguardando PostgreSQL ficar pronto para conexões..."
until docker compose -f deploy/docker-compose.yml exec -T postgres pg_isready -U postgres; do
  echo "Aguardando PostgreSQL inicializar..."
  sleep 2
done
echo "[OK] PostgreSQL está pronto e aceitando conexões!"

# 4. Executar Migrações
echo ""
echo "[3/4] Aplicando migrações SQL (000001_init_schema e 000002_seed_data)..."
cat backend/migrations/000001_init_schema.up.sql | docker compose -f deploy/docker-compose.yml exec -T postgres psql -U postgres -d slowsocial
cat backend/migrations/000002_seed_data.up.sql | docker compose -f deploy/docker-compose.yml exec -T postgres psql -U postgres -d slowsocial

# 5. Resumo dos serviços
echo ""
echo "[4/4] Infraestrutura pronta com sucesso!"
echo "--------------------------------------------------"
echo "API Gateway (Go):         http://localhost:8080"
echo "PostgreSQL 16:            localhost:5432 (slowsocial / postgres:postgres)"
echo "Redis 7:                  localhost:6379"
echo "Apache Kafka KRaft:       localhost:9092"
echo "MinIO S3 Console:         http://localhost:9001 (minioadmin / minioadmin)"
echo "MinIO S3 API:             http://localhost:9000"
echo "Prometheus Metrics:       http://localhost:9090"
echo "Grafana Dashboards:       http://localhost:3001 (admin / admin)"
echo "OTel Collector:           http://localhost:4317 (gRPC) / 4318 (HTTP)"
echo "--------------------------------------------------"
echo ""
echo "Para iniciar a API em Go:"
echo "  cd backend && go run cmd/api/main.go"
echo ""
echo "Para iniciar o Mobile Flutter:"
echo "  cd mobile && flutter run"
