# PowerShell Dev Environment Launcher for SlowSocial
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   SlowSocial - Local Development Stack    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verificar Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Docker não foi encontrado no PATH. Por favor instale o Docker Desktop." -ForegroundColor Red
    exit 1
}

# 2. Subir containers
Write-Host "`n[1/4] Iniciando containers de infraestrutura (PostgreSQL, Redis, Kafka, MinIO, OTel)..." -ForegroundColor Yellow
docker compose -f deploy/docker-compose.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao iniciar containers docker-compose." -ForegroundColor Red
    exit 1
}

# 3. Aguardar PostgreSQL ficar pronto
Write-Host "`n[2/4] Aguardando PostgreSQL ficar pronto para conexões..." -ForegroundColor Yellow
$retries = 20
$ready = $false
while ($retries -gt 0) {
    $status = docker compose -f deploy/docker-compose.yml exec -T postgres pg_isready -U postgres 2>$null
    if ($status -like "*accepting connections*") {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 2
    $retries--
}

if (-not $ready) {
    Write-Host "[AVISO] Timeout aguardando pg_isready. Continuando..." -ForegroundColor Yellow
} else {
    Write-Host "[OK] PostgreSQL está pronto e aceitando conexões!" -ForegroundColor Green
}

# 4. Executar Migrações do Banco de Dados
Write-Host "`n[3/4] Aplicando migrações SQL (000001_init_schema e 000002_seed_data)..." -ForegroundColor Yellow
Get-Content backend/migrations/000001_init_schema.up.sql | docker compose -f deploy/docker-compose.yml exec -T postgres psql -U postgres -d slowsocial
Get-Content backend/migrations/000002_seed_data.up.sql | docker compose -f deploy/docker-compose.yml exec -T postgres psql -U postgres -d slowsocial

# 5. Resumo dos serviços
Write-Host "`n[4/4] Infraestrutura pronta com sucesso!" -ForegroundColor Green
Write-Host "--------------------------------------------------"
Write-Host "API Gateway (Go):         http://localhost:8080" -ForegroundColor Cyan
Write-Host "PostgreSQL 16:            localhost:5432 (slowsocial / postgres:postgres)" -ForegroundColor Cyan
Write-Host "Redis 7:                  localhost:6379" -ForegroundColor Cyan
Write-Host "Apache Kafka KRaft:       localhost:9092" -ForegroundColor Cyan
Write-Host "MinIO S3 Console:         http://localhost:9001 (minioadmin / minioadmin)" -ForegroundColor Cyan
Write-Host "MinIO S3 API:             http://localhost:9000" -ForegroundColor Cyan
Write-Host "Prometheus Metrics:       http://localhost:9090" -ForegroundColor Cyan
Write-Host "Grafana Dashboards:       http://localhost:3001 (admin / admin)" -ForegroundColor Cyan
Write-Host "OTel Collector:           http://localhost:4317 (gRPC) / 4318 (HTTP)" -ForegroundColor Cyan
Write-Host "--------------------------------------------------"
Write-Host "`nPara iniciar a API em Go:`n  cd backend`n  go run cmd/api/main.go`n" -ForegroundColor White
Write-Host "Para iniciar o Mobile Flutter:`n  cd mobile`n  flutter run`n" -ForegroundColor White
