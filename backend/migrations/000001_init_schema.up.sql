-- =========================================================================
-- SLOWSOCIAL DATABASE SCHEMA V1 (PostgreSQL 16)
-- Focado em alta escalabilidade, concorrência, consistência ACID e ordenação
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA DE USUÁRIOS (Sincronizado com Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Mapeado do Supabase Auth auth.users(id)
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    headline VARCHAR(120),
    bio TEXT,
    location VARCHAR(100),
    pronouns VARCHAR(30),
    degree_level INT DEFAULT 1,
    verified_links JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    testimonial_tokens INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. TABELA DE PUBLICAÇÕES (Posts de Alta Qualidade & Formatos Ricos)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    format_type VARCHAR(32) NOT NULL DEFAULT 'thought', -- 'thought', 'article', 'audio_memo', 'video_lab', 'photo_carousel', 'code_snippet'
    media_urls JSONB DEFAULT '[]'::jsonb,
    code_snippet JSONB,
    audio_note JSONB,
    aspect_ratio VARCHAR(10) DEFAULT '16:9',
    reactions_count INT DEFAULT 0,
    responses_count INT DEFAULT 0,
    saved_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

-- 3. TABELA DE MOMENTOS (Stories 24h Efêmeros)
CREATE TABLE IF NOT EXISTS momentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT,
    text_note TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_momentos_author_expires ON momentos(author_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_momentos_active ON momentos(expires_at) WHERE expires_at > NOW();

-- Rastreio de Visualizações de Momentos
CREATE TABLE IF NOT EXISTS momento_views (
    momento_id UUID NOT NULL REFERENCES momentos(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (momento_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_momento_views_viewer ON momento_views(viewer_id);

-- 4. TABELA DE REAÇÕES (6 Emojis Oficiais Apple/Lottie)
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL, -- 'post', 'momento', 'comment'
    target_id UUID NOT NULL,
    reaction_type VARCHAR(20) NOT NULL, -- 'heart', 'clap', 'lightbulb', 'handshake', 'fire', 'thinking'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_target_reaction UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);

-- 5. TABELA DE COMENTÁRIOS E RESPOSTAS APROFUNDADAS
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at ASC);

-- 6. TABELA DE CONEXÕES / GRAFO SOCIAL DE GRAUS
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    degree_level INT NOT NULL DEFAULT 1, -- 1º, 2º grau
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'pending', 'active', 'blocked'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_connection_pair UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_user_a ON connections(user_a_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_user_b ON connections(user_b_id, status);

-- 7. TABELA DE CONVERSAS (Mensagens Diretas e Solicitações de Contato)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tab VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct', 'request'
    participant_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(140), -- Assunto obrigatório de até 140 chars para solicitações
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'pending_request', 'active', 'archived'
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_conversation_participants UNIQUE (participant_a_id, participant_b_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON conversations(participant_a_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON conversations(participant_b_id, last_message_at DESC);

-- 8. TABELA DE MENSAGENS EM TEMPO REAL
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    audio_url TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at ASC);

-- 9. TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(140) NOT NULL,
    detail TEXT,
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);
