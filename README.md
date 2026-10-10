# SlowSocial 🌿✨

> Plataforma de rede social calma, consciente e de alto desempenho projetada para o mundo real. Base de código mobile unificada em **Flutter**, backend distribuído e de baixa latência em **Go (Golang)**, mensageria orientada a eventos com **Apache Kafka**, persistência relacional **PostgreSQL**, cache **Redis**, e infraestrutura escalável com **Docker**, **Kubernetes** e **Easypanel**.

---

## 🌐 Deploy em Produção Real com Easypanel

Para colocar o SlowSocial no ar de verdade em uma VPS (Hetzner, Contabo, DigitalOcean, etc.) com domínio próprio, SSL gratuito e painel visual:

👉 **[Consulte o Guia Passo a Passo: DEPLOY_EASYPANEL.md](./DEPLOY_EASYPANEL.md)**

---

## 🏗️ Stack Tecnológica de Produção

| Camada | Tecnologia | Propósito e Responsabilidade |
|---|---|---|
| **Mobile App** | **Flutter + Dart** | Aplicativo nativo iOS e Android com design Apple HIG e OLED Dark nativo. |
| **API Gateway & Core** | **Go (Golang 1.23)** | Serviço HTTP/REST de alta performance, feed, reações, momentos e conexões. |
| **Autenticação** | **Supabase Auth** | Gerenciamento de credenciais, sign-up/login seguro e validação de tokens JWT. |
| **Banco de Dados** | **PostgreSQL 16** | Persistência relacional ACID com particionamento e índices otimizados para grafos sociais. |
| **Cache & Presença** | **Redis 7** | Armazenamento de feeds pré-computados (`ZSET`), controle de presença e rate limiting. |
| **Mensageria & Streaming** | **Apache Kafka (KRaft)** | Barramento assíncrono para fan-out de posts, transcodificação e notificações. |
| **Comunicação Tempo Real** | **WebSockets (Gorilla)** | Mensagens diretas instantâneas, status de digitação e eventos de presença. |
| **Storage de Mídia** | **Cloudflare R2 / AWS S3** | Upload direto via URLs pré-assinadas (*Presigned URLs*), sem gargalos no gateway. |
| **CDN Global** | **Cloudflare CDN** | Cache distribuído na borda, terminação TLS e otimização de entrega de imagens. |
| **Transcodificação de Mídia**| **FFmpeg (Worker Service)**| Geração automática de miniaturas e conversão de vídeo para streaming HLS adaptativo. |
| **Notificações Push** | **Firebase Cloud Messaging** | Entrega confiável de notificações push para smartphones Android e iPhones. |
| **Observabilidade** | **OpenTelemetry + Grafana** | Coleta padronizada de métricas, traces distribuídos e dashboards de desempenho. |
| **Orquestração & Painel** | **Easypanel / Kubernetes** | Deploy simples em VPS via Easypanel ou cluster elástico com K8s (HPA). |
| **Automação CI/CD** | **GitHub Actions** | Pipelines automatizados de testes unitários, análise estática e builds de containers/APK. |

---

## 📁 Estrutura do Repositório

```text
SlowSocial/
├── backend/                  # Backend Go (Golang 1.23)
│   ├── cmd/
│   │   ├── api/              # Ponto de entrada do API Gateway HTTP e WebSockets
│   │   └── worker/           # Worker assíncrono de eventos Kafka, FFmpeg e Push FCM
│   ├── internal/
│   │   ├── auth/             # Middleware de validação Supabase JWT
│   │   ├── chat/             # Serviço de conversas e mensagens diretas
│   │   ├── comments/         # Comentários em árvore e respostas aprofundadas
│   │   ├── config/           # Carregador tipado de variáveis de ambiente
│   │   ├── connections/      # Grafo social e networking consciente (nota até 140 chars)
│   │   ├── database/         # Pool de conexões pgxpool para PostgreSQL
│   │   ├── events/           # Produtor e consumidor Apache Kafka (KRaft)
│   │   ├── feed/             # Serviço híbrido de timeline (Redis ZSET + Postgres fallback)
│   │   ├── media/            # Gerador de S3 Presigned URLs e processador FFmpeg
│   │   ├── momentos/         # Stories de 24h efêmeros com agrupamento por autor
│   │   ├── notifications/    # Central de alertas com contadores para badges
│   │   ├── push/             # Integração Firebase Cloud Messaging (FCM)
│   │   ├── realtime/         # Hub de WebSockets com suporte a ping/pong
│   │   └── users/            # Perfil do usuário e cálculo dinâmico de conexões
│   ├── migrations/           # Scripts SQL (000001_init_schema, 000002_seed_data)
│   └── pkg/response/         # Padronizador de respostas JSON da API
├── mobile/                   # Aplicativo Mobile Flutter + Dart (iOS / Android)
│   ├── android/              # Plataforma nativa Android 14 (API 34)
│   ├── ios/                  # Plataforma nativa iOS 14.0+ (Apple HIG)
│   ├── lib/                  # Código do app (Riverpod, Dio, GoRouter, telas calmas)
│   └── test/                 # Testes unitários dos modelos
├── deploy/                   # Infraestrutura e Implantação
│   ├── docker/               # Dockerfiles multi-stage para API e Worker
│   ├── docker-compose.yml    # Ambiente completo local (Postgres, Redis, Kafka, MinIO, OTel)
│   ├── .env                  # Variáveis de ambiente locais
│   └── k8s/base/             # Manifestos Kubernetes (Deployments, HPA, Services, Ingress)
├── scripts/                  # Scripts de automação para desenvolvedores
│   ├── dev-up.ps1 / dev-up.sh# Inicialização completa da infraestrutura com 1 comando
│   └── dev-down.ps1 / dev-down.sh
├── DEPLOY_EASYPANEL.md       # 📖 Guia de Deploy em Produção Real com VPS & Easypanel
└── .github/workflows/        # CI/CD automatizado (Go & Flutter)
```

---

## 🚀 Como Iniciar o Ambiente Local

### 1. Pré-requisitos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.
* [Go 1.23+](https://go.dev/dl/) (para desenvolvimento backend).
* [Flutter SDK 3.24+](https://flutter.dev/docs/get-started/install) (para desenvolvimento mobile).

### 2. Subir a Infraestrutura com 1 Comando

No Windows (PowerShell):
```powershell
.\scripts\dev-up.ps1
```

No Linux / macOS:
```bash
chmod +x scripts/*.sh
./scripts/dev-up.sh
```

O script inicializa automaticamente:
- **PostgreSQL 16** na porta `5432` e executa as migrações e dados de teste iniciais.
- **Redis 7** na porta `6379`.
- **Apache Kafka (KRaft)** na porta `9092`.
- **MinIO (S3 compatível)** na porta `9000` (Console em `http://localhost:9001`).
- **Prometheus** na porta `9090` e **Grafana** na porta `3001`.
- **OpenTelemetry Collector** nas portas `4317` (gRPC) e `4318` (HTTP).

### 3. Executar o Backend em Go
```bash
cd backend
go run cmd/api/main.go
```
Para rodar o Worker de eventos em paralelo:
```bash
cd backend
go run cmd/worker/main.go
```

### 4. Executar o Aplicativo Flutter
```bash
cd mobile
flutter pub get
flutter run
```

---

## 📡 Endpoints Principais da API

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/health` | Verificação de integridade dos serviços |
| `GET` | `/ws` | Conexão WebSocket para chats e notificações |
| `GET` | `/api/v1/feed` | Obter timeline (prioriza Redis ZSET, fallback Postgres) |
| `POST` | `/api/v1/posts` | Criar nova publicação (dispara evento Kafka `post.created`) |
| `POST` | `/api/v1/posts/{id}/react` | Reagir a um post (❤️ curtida, 👏 parabéns, 💡 genial, etc.) |
| `GET` | `/api/v1/posts/{id}/comments` | Listar respostas e comentários do post |
| `POST` | `/api/v1/posts/{id}/comments` | Publicar resposta aprofundada |
| `GET` | `/api/v1/momentos` | Listar momentos ativos das últimas 24 horas agrupados por autor |
| `POST` | `/api/v1/momentos` | Publicar um novo story efêmero |
| `POST` | `/api/v1/media/presign-upload` | Gerar URL pré-assinada S3 para upload direto |
| `GET` | `/api/v1/connections` | Listar conexões ativas ou solicitações pendentes |
| `POST` | `/api/v1/connections/request` | Enviar solicitação de conexão (com nota reflexiva até 140 chars) |
| `POST` | `/api/v1/connections/{id}/accept` | Aceitar solicitação de conexão |
| `GET` | `/api/v1/notifications` | Listar notificações do usuário |
| `GET` | `/api/v1/users/me` | Obter perfil do usuário autenticado |
| `GET` | `/api/v1/conversations` | Listar conversas ativas e solicitações |
| `POST` | `/api/v1/conversations/{id}/messages` | Enviar mensagem direta |

---

## 🧪 Testes Automatizados

```bash
# Executar testes unitários do Backend Go
cd backend
go test -v -race ./...

# Executar testes unitários do Mobile Flutter
cd mobile
flutter test
```

---

## 📄 Licença

Distribuído sob a licença MIT.
