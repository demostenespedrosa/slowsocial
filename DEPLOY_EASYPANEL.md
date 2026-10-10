# 🚀 Guia Definitivo: Como Colocar o SlowSocial no Ar com Easypanel

> Este guia ensina passo a passo como colocar a infraestrutura completa do **SlowSocial** (Backend Go, PostgreSQL, Redis, Kafka, Worker com FFmpeg e App Mobile Flutter) em produção real em uma VPS utilizando o **Easypanel** com SSL automático e domínio personalizado.

---

## 📑 Índice
1. [Requisitos Mínimos da VPS](#1-requisitos-mínimos-da-vps)
2. [Instalação do Easypanel no Servidor](#2-instalação-do-easypanel-no-servidor)
3. [Configuração de Domínio e Cloudflare](#3-configuração-de-domínio-e-cloudflare)
4. [Criação do Projeto no Easypanel](#4-criação-do-projeto-no-easypanel)
5. [Provisionando o Banco de Dados PostgreSQL 16](#5-provisionando-o-banco-de-dados-postgresql-16)
6. [Executando as Migrações SQL](#6-executando-as-migrações-sql)
7. [Provisionando o Cache Redis 7](#7-provisionando-o-cache-redis-7)
8. [Provisionando o Apache Kafka (KRaft Mode)](#8-provisionando-o-apache-kafka-kraft-mode)
9. [Configurando Serviços Externos (Supabase, S3/R2, FCM)](#9-configurando-serviços-externos)
10. [Deploy do API Gateway em Go](#10-deploy-do-api-gateway-em-go)
11. [Deploy do Worker Assíncrono (FFmpeg + FCM)](#11-deploy-do-worker-assíncrono)
12. [Publicação e Lançamento do App Flutter (Android e iOS)](#12-publicação-do-app-flutter)
13. [Monitoramento e Backups Automáticos](#13-monitoramento-e-backups-automáticos)

---

## 1. Requisitos Mínimos da VPS

Para rodar toda a infraestrutura com folga e performance:

* **Sistema Operacional:** Ubuntu 22.04 LTS ou 24.04 LTS (64-bit limpo).
* **Configuração Recomendada (Até 20.000 usuários ativos):**
  * **CPU:** 4 vCPUs
  * **Memória RAM:** 8 GB RAM
  * **Armazenamento:** 80 GB SSD / NVMe
* **Provedores Recomendados (Custo-Benefício):**
  * **Hetzner Cloud:** CPX31 ou CX32 (~€12 a €15/mês) - Excelente performance.
  * **Contabo:** Cloud VPS M (~€10/mês) - Muito espaço em disco e RAM.
  * **DigitalOcean / Linode:** Droplet 8GB RAM (~$40 a $48/mês).

---

## 2. Instalação do Easypanel no Servidor

1. Acesse sua VPS via terminal SSH como `root`:
   ```bash
   ssh root@IP_DA_SUA_VPS
   ```

2. Atualize o sistema operacional:
   ```bash
   apt update && apt upgrade -y
   ```

3. Instale o Docker e o Easypanel com um único comando oficial:
   ```bash
   curl -sSL https://get.easypanel.io | sh
   ```

4. Após a conclusão (cerca de 2 minutos), o terminal exibirá a URL de acesso:
   ```text
   Easypanel is running at http://IP_DA_SUA_VPS:3000
   ```

5. Abra essa URL no seu navegador e crie sua conta de administrador (email e senha).

---

## 3. Configuração de Domínio e Cloudflare

Para ter proteção contra DDoS, CDN global e SSL automático:

1. Crie uma conta gratuita na [Cloudflare](https://dash.cloudflare.com/) e adicione seu domínio (ex: `slowsocial.app`).
2. No menu **DNS > Records**, crie os seguintes apontamentos tipo **A**:
   * **Nome:** `easypanel` | **IPv4:** `IP_DA_SUA_VPS` | **Proxy:** Desativado (cinza) no primeiro momento.
   * **Nome:** `api` | **IPv4:** `IP_DA_SUA_VPS` | **Proxy:** Ativado (nuvem laranja).
3. No Cloudflare, vá em **SSL/TLS**:
   * Selecione o modo de criptografia: **Full (strict)**.
4. No Cloudflare, vá em **Network**:
   * Certifique-se de que a opção **WebSockets** esteja **Ativada** (necessária para os chats em tempo real).

---

## 4. Criação do Projeto no Easypanel

1. No painel do Easypanel, clique no botão **+ New Project**.
2. Dê o nome de: `slowsocial`.

Dentro desse projeto, nós vamos criar **5 serviços**:
* `postgres` (Banco de Dados)
* `redis` (Cache & Presença)
* `kafka` (Mensageria KRaft)
* `api` (API Gateway Go)
* `worker` (Processador de Mídia e Push)

---

## 5. Provisionando o Banco de Dados PostgreSQL 16

1. Dentro do projeto `slowsocial`, clique em **+ Service > Database > Postgres**.
2. Configure:
   * **Service Name:** `postgres`
   * **Image:** `postgres:16-alpine`
3. Na aba **Environment**, defina:
   * `POSTGRES_DB`: `slowsocial`
   * `POSTGRES_USER`: `postgres`
   * `POSTGRES_PASSWORD`: `CRIE_UMA_SENHA_MUITO_FORTE_AQUI`
4. Na aba **Volumes**, verifique se o volume persistente `/var/lib/postgresql/data` está ativo.
5. Clique em **Deploy**.

> **Anotação de Conexão Interna:**  
> A URL interna entre contêineres será:  
> `postgres://postgres:SUA_SENHA@postgres:5432/slowsocial?sslmode=disable`

---

## 6. Executando as Migrações SQL

Para criar as tabelas e dados iniciais no PostgreSQL:

1. No Easypanel, clique no serviço `postgres` e vá na aba **Console / Terminal**.
2. Abra o cliente `psql`:
   ```bash
   psql -U postgres -d slowsocial
   ```
3. Abra em outra aba do seu computador os arquivos:
   * [`backend/migrations/000001_init_schema.up.sql`](file:///c:/Users/demostenes/Documents/SlowSocial/backend/migrations/000001_init_schema.up.sql)
   * [`backend/migrations/000002_seed_data.up.sql`](file:///c:/Users/demostenes/Documents/SlowSocial/backend/migrations/000002_seed_data.up.sql)
4. Cole o conteúdo de cada um no console e pressione `Enter`.
5. Digite `\dt` para confirmar que todas as 10 tabelas (`users`, `posts`, `momentos`, `reactions`, etc.) foram criadas. Digite `\q` para sair.

---

## 7. Provisionando o Cache Redis 7

1. Dentro do projeto `slowsocial`, clique em **+ Service > Database > Redis**.
2. Configure:
   * **Service Name:** `redis`
   * **Image:** `redis:7-alpine`
3. Na aba **Environment**:
   * `REDIS_PASSWORD`: `CRIE_UMA_SENHA_REDIS_FORTE`
4. Clique em **Deploy**.

> **Anotação de Conexão Interna:**  
> Host: `redis:6379` | Senha: `SUA_SENHA_REDIS`

---

## 8. Provisionando o Apache Kafka (KRaft Mode)

O SlowSocial utiliza o Kafka 3.7+ no moderno modo **KRaft** (sem ZooKeeper).

1. Dentro do projeto `slowsocial`, clique em **+ Service > App**.
2. Configure:
   * **Service Name:** `kafka`
   * **Source:** Docker Image
   * **Image:** `apache/kafka:3.7.0`
3. Na aba **Environment**, adicione as seguintes variáveis obrigatórias:
   ```env
   KAFKA_NODE_ID=1
   KAFKA_PROCESS_ROLES=broker,controller
   KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
   KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
   KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER
   KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
   KAFKA_CONTROLLER_QUORUM_VOTERS=1@kafka:9093
   KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
   KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1
   KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1
   KAFKA_LOG_DIRS=/tmp/kraft-combined-logs
   CLUSTER_ID=4L622nShTUiBenDuA55QgA
   ```
4. Na aba **Volumes**, adicione:
   * Path no contêiner: `/tmp/kraft-combined-logs`
5. Clique em **Deploy**.

---

## 9. Configurando Serviços Externos

Antes de subir a API, obtenha as chaves gratuitas dos 3 serviços parceiros:

### 9.1. Supabase Auth (Login e Autenticação de Usuários)
1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Vá em **Project Settings > API**:
   * Copie a **Project URL** (ex: `https://xyz.supabase.co`).
   * Copie o **JWT Secret** (chave de 32+ caracteres localizada na seção *JWT Settings*).

### 9.2. Armazenamento S3 (Cloudflare R2 ou AWS S3)
*Recomendamos o **Cloudflare R2** por não cobrar taxa de transferência (Zero Egress Fees):*
1. No painel da Cloudflare, vá em **R2 Object Storage > Create Bucket**:
   * Nome: `slowsocial-media-production`.
2. Clique em **Manage R2 API Tokens > Create API Token**:
   * Permissão: *Object Read & Write*.
   * Copie o `Access Key ID`, `Secret Access Key` e o `Endpoint URL`.
3. Em **Settings** do bucket, conecte um subdomínio customizado (ex: `media.slowsocial.app`).

### 9.3. Firebase Cloud Messaging (Notificações Push no Celular)
1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. Vá em **Project Settings > Cloud Messaging**.
3. Copie o **Server Key** ou gere uma chave de conta de serviço.

---

## 10. Deploy do API Gateway em Go

1. No Easypanel, dentro do projeto `slowsocial`, clique em **+ Service > App**.
2. **Geral:**
   * **Service Name:** `api`
3. **Source:**
   * Selecione **GitHub**.
   * Repositório: `demostenespedrosa/slowsocial`
   * Branch: `main`
   * **Build Type:** `Dockerfile`
   * **Root Directory:** `backend` *(ou deixe em branco se o Dockerfile Path for `Dockerfile`)*
   * **Dockerfile Path:** `Dockerfile` *(localizado em `backend/Dockerfile`)*
4. **Domains (Domínio):**
   * Adicione: `api.slowsocial.app`
   * Port: `8080`
   * Habilite SSL / HTTPS (o Easypanel emite o certificado Let's Encrypt automaticamente).
5. **Environment (Variáveis de Ambiente):**
   ```env
   PORT=8080
   ENVIRONMENT=production
   ALLOWED_ORIGINS=https://slowsocial.app,http://localhost:3000
   
   DATABASE_URL=postgres://postgres:SUA_SENHA_POSTGRES@postgres:5432/slowsocial?sslmode=disable
   DB_MAX_CONNS=50
   DB_MIN_CONNS=10
   
   REDIS_ADDR=redis:6379
   REDIS_PASSWORD=SUA_SENHA_REDIS
   REDIS_DB=0
   
   KAFKA_BROKERS=kafka:9092
   KAFKA_CONSUMER_GROUP=slowsocial-api-group
   
   SUPABASE_URL=https://SEU_PROJETO.supabase.co
   SUPABASE_JWT_SECRET=SEU_SUPABASE_JWT_SECRET
   
   S3_ENDPOINT=https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
   S3_BUCKET=slowsocial-media-production
   S3_ACCESS_KEY=SEU_R2_ACCESS_KEY
   S3_SECRET_KEY=SEU_R2_SECRET_KEY
   S3_REGION=auto
   CDN_BASE_URL=https://media.slowsocial.app
   ```
6. Clique em **Deploy**.
7. Verifique o log. Quando surgir a mensagem:
   `🚀 Servidor HTTP rodando na porta 8080`, acesse no navegador:
   `https://api.slowsocial.app/health` para ver o status `healthy`.

---

## 11. Deploy do Worker Assíncrono (FFmpeg + FCM)

O worker consome mensagens do Kafka para fan-out de timeline, transcodificação de vídeos e envio de push.

1. No Easypanel, clique em **+ Service > App**.
2. **Geral:**
   * **Service Name:** `worker`
3. **Source:**
   * Selecione **GitHub**: `demostenespedrosa/slowsocial`
   * Branch: `main`
   * **Build Type:** `Dockerfile`
   * **Root Directory:** `backend`
   * **Dockerfile Path:** `Dockerfile.worker`
4. **Domains:**
   * *Nenhum domínio é necessário* (o worker é um serviço em segundo plano).
5. **Environment:**
   * Copie as mesmas variáveis de ambiente do serviço `api` acima.
6. Clique em **Deploy**.
7. No log do worker, você verá:
   `✅ SlowSocial Worker escutando 3 tópicos Kafka com sucesso`.

---

## 12. Publicação do App Flutter

Agora que seu backend está respondendo em `https://api.slowsocial.app`:

### 12.1. Apontar o App Mobile para a API de Produção
Abra o arquivo [`mobile/lib/core/network/api_client.dart`](file:///c:/Users/demostenes/Documents/SlowSocial/mobile/lib/core/network/api_client.dart) e garanta que a URL padrão seja a sua API de produção:
```dart
static const String defaultBaseUrl = 'https://api.slowsocial.app/api/v1';
```

### 12.2. Gerar o Aplicativo para Android (Google Play)
1. No seu terminal, entre na pasta do aplicativo:
   ```bash
   cd mobile
   flutter pub get
   ```
2. Para testar no seu celular Android:
   ```bash
   flutter build apk --release
   ```
   *(O arquivo final será gerado em `build/app/outputs/flutter-apk/app-release.apk`)*.
3. Para publicar na Google Play Store:
   ```bash
   flutter build appbundle --release
   ```
   *(Gera o arquivo otimizado `.aab` pronto para upload na Play Console)*.

### 12.3. Gerar o Aplicativo para iOS (Apple App Store)
*(Requer um Mac com Xcode instalado)*
1. No terminal do Mac:
   ```bash
   cd mobile
   flutter build ipa --release
   ```
2. Abra o Xcode Organizer e envie o build para o TestFlight / App Store Connect com 1 clique.

---

## 13. Monitoramento e Backups Automáticos

1. **Backups Diários do PostgreSQL no Easypanel:**
   * Acesse o serviço `postgres` > aba **Backups**.
   * Habilite backups automáticos para um bucket S3/R2 ou localmente na VPS.
2. **Reinicialização Automática em Falhas:**
   * O Easypanel e o Docker mantêm política de reinicialização `unless-stopped` em todos os contêineres. Se o servidor reiniciar, tudo volta ao ar sozinho.
3. **Métricas de CPU e RAM:**
   * Pelo próprio Easypanel, monitore os gráficos de consumo de CPU e memória em tempo real de cada serviço.

---

**🎉 Parabéns! Sua rede social SlowSocial está 100% online, segura e operando no mundo real.**
