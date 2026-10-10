#!/usr/bin/env bash
echo "Parando containers do SlowSocial..."
docker compose -f deploy/docker-compose.yml down
echo "Containers encerrados com sucesso."
