# PowerShell Dev Environment Teardown for SlowSocial
Write-Host "Parando containers do SlowSocial..." -ForegroundColor Yellow
docker compose -f deploy/docker-compose.yml down
Write-Host "Containers encerrados com sucesso." -ForegroundColor Green
