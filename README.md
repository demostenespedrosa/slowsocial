# SlowSocial 🌿✨

> Plataforma de rede social calma, consciente e de alto desempenho projetada para o mundo real. Base de código mobile unificada em **Flutter**, backend distribuído e de baixa latência em **Go (Golang)**, mensageria orientada a eventos com **Apache Kafka**, persistência relacional **PostgreSQL**, cache **Redis**, e infraestrutura escalável com **Docker** e **Kubernetes**.

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
| **Storage de Mídia** | **AWS S3 / MinIO** | Upload direto via URLs pré-assinadas (*Presigned URLs*), sem gargalos no gateway. |
| **CDN Global** | **Cloudflare CDN** | Cache distribuído na borda, terminação TLS e otimização de entrega de imagens. |
| **Transcodificação de Mídia**| **FFmpeg (Worker Service)**| Geração automática de miniaturas e conversão de vídeo para streaming HLS adaptativo. |
| **Notificações Push** | **Firebase Cloud Messaging** | Entrega confiável de notificações push para smartphones Android e iPhones. |
| **Observabilidade** | **OpenTelemetry + Grafana** | Coleta padronizada de métricas, traces distribuídos e dashboards de desempenho. |
| **Orquestração** | **Docker & Kubernetes (HPA)**| Containers imutáveis, autoescalonamento horizontal (HPA) e alta disponibilidade. |
| **Automação CI/CD** | **GitHub Actions** | Pipelines automatizados de testes unitários, análise estática e builds de containers/APK. |

---

## 📁 Estrutura do Repositório

```text
SlowSocial/
├── backend/                  # Backend Go (Golang 1.23)
│   ├── cmd/
│   │   ├── api/              # Ponto de entrada do API Gateway HTTP e WebSockets
│   │   └── worker/           # Worker assíncrono de eventos Kafka e transcodificação
│   ├── internal/
│   │   ├── auth/             # Middleware de validação Supabase JWT
│   │   ├── chat/             # Serviço de conversas e mensagens diretas
│   │   ├── config/           # Carregador tipado de variáveis de ambiente
│   │   ├── database/         # Pool de conexões pgxpool para PostgreSQL
│   │   ├── events/           # Produtor e consumidor Apache Kafka
│   │   ├── feed/             # Serviço híbrido de timeline (Redis ZSET + Postgres fallback)
│   │   ├── media/            # Gerador de S3 Presigned URLs e processador FFmpeg
│   │   ├── momentos/         # Stories de 24h efêmeros com agrupamento por autor
│   │   ├── push/             # Integração Firebase Cloud Messaging (FCM)
│   │   └── realtime/         # Hub de WebSockets com suporte a ping/pong
│   ├── migrations/           # Scripts SQL (000001_init_schema, 000002_seed_data)
│   └── pkg/response/         # Padronizador de respostas JSON da API
├── mobile/                   # Aplicativo Mobile Flutter + Dart (iOS / Android)
│   ├── lib/
│   │   ├── core/             # Modelos, tema Apple HIG, cliente Dio HTTP e Riverpod
│   │   └── features/
│   │       ├── auth/         # Autenticação com Supabase
│   │       ├── chat/         # Chats diretos e solicitações
│   │       ├── communities/  # Comunidades calmas temáticas
│   │       ├── composer/     # Publicador de pensamentos, artigos, código e áudio
│   │       ├── feed/         # Feed de Conexões e Radar com reações táteis e comentários
│   │       ├── momentos/     # Stories estilo Instagram (tela cheia, progresso, reações)
│   │       ├── navigation/   # Shell de navegação nativa inferior
│   │       └── notifications/# Centro de notificações e solicitações de conexão
│   └── test/                 # Testes unitários do aplicativo
├── deploy/                   # Infraestrutura e Implantação
│   ├── docker/               # Dockerfiles multi-stage para API e Worker
│   ├── docker-compose.yml    # Ambiente completo local (Postgres, Redis, Kafka, MinIO, OTel)
│   └── k8s/base/             # Manifestos Kubernetes (Deployments, HPA, Services, Ingress)
├── scripts/                  # Scripts de automação para desenvolvedores
│   ├── dev-up.ps1 / dev-up.sh# Inicialização completa da infraestrutura com 1 comando
│   └── dev-down.ps1 / dev-down.sh
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
| `GET` | `/api/v1/feed?filter=connections` | Obter timeline (prioriza Redis ZSET, fallback Postgres) |
| `POST` | `/api/v1/posts` | Criar nova publicação (dispara evento Kafka `post.created`) |
| `POST` | `/api/v1/posts/{id}/react` | Reagir a um post (❤️ curtida, 👏 parabéns, 💡 genial, etc.) |
| `GET` | `/api/v1/momentos` | Listar momentos ativos das últimas 24 horas agrupados por autor |
| `POST` | `/api/v1/momentos` | Publicar um novo story efêmero |
| `POST` | `/api/v1/media/presign-upload` | Gerar URL pré-assinada S3 para upload direto |
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
