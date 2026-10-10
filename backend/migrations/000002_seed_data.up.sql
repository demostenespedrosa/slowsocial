-- =========================================================================
-- SEED DATA DE PRODUÇÃO / DESENVOLVIMENTO: SLOWSOCIAL
-- Popula usuários reais, conexões de 1º e 2º grau, posts, momentos e chats
-- =========================================================================

-- 1. USUÁRIOS
INSERT INTO users (id, username, email, full_name, avatar_url, headline, bio, location, pronouns, degree_level)
VALUES 
('a0000000-0000-0000-0000-000000000001', 'demostenes', 'demostenes@slowsocial.app', 'Demóstenes', 
 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
 'Arquiteto de Sistemas & Entusiasta de Computação Pessoal',
 'Interessado em sistemas distribuídos, protocolos abertos e no desenvolvimento de interfaces calmas que respeitam a atenção e a cognição humana.',
 'São Paulo, Brasil', 'ele/dele', 1),

('a0000000-0000-0000-0000-000000000002', 'alice', 'alice@slowsocial.app', 'Alice Liddell',
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
 'Pesquisadora em Interação Humano-Computador & Ergonomia Cognitiva',
 'Estudo como a sobrecarga de estímulos afeta a tomada de decisão no ambiente de trabalho remoto.',
 'São Paulo, Brasil', 'ela/dela', 1),

('a0000000-0000-0000-0000-000000000003', 'tomas', 'tomas@slowsocial.app', 'Tomás Ramos',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
 'Engenheiro de Firmware & Hardware Aberto',
 'Projetando circuitos de ultra-baixo consumo para sensores agrícolas e estações meteorológicas.',
 'Campinas, Brasil', 'ele/dele', 1),

('a0000000-0000-0000-0000-000000000004', 'mariana', 'mariana@slowsocial.app', 'Mariana Costa',
 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
 'Líder Técnica & Autora de Guias de Acessibilidade Digital',
 'Revisando paletas de alto contraste e navegação pura por teclado.',
 'Curitiba, Brasil', 'ela/dela', 2),

('a0000000-0000-0000-0000-000000000005', 'lucas', 'lucas@slowsocial.app', 'Lucas Barreto',
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
 'Desenvolvedor Backend (Sistemas de Arquivos & Bancos de Dados)',
 'Escrevendo B-Trees e otimizando I/O de disco sem alocações no heap.',
 'Belo Horizonte, Brasil', 'ele/dele', 2)
ON CONFLICT (id) DO NOTHING;

-- 2. GRAFO SOCIAL DE CONEXÕES
INSERT INTO connections (user_a_id, user_b_id, degree_level, status)
VALUES
('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 1, 'active'),
('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 1, 'active'),
('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 1, 'active'),
('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 1, 'active')
ON CONFLICT DO NOTHING;

-- 3. PUBLICAÇÕES INICIAIS
INSERT INTO posts (id, author_id, content, format_type, media_urls, reactions_count, responses_count)
VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 
 'A atenção é o recurso mais raro e precioso da era moderna. Não a negocie por estímulos descartáveis. Quando silenciamos as notificações desnecessárias, o pensamento ganha profundidade.', 
 'thought', '[]'::jsonb, 14, 3),

('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 
 'Primeiro sinal limpo no osciloscópio do novo sensor solar. 18µA de consumo médio em standby com rádio LoRa ativado periodicamente.', 
 'thought', '["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"]'::jsonb, 8, 2)
ON CONFLICT (id) DO NOTHING;

-- 4. MOMENTOS EFÊMEROS (STORIES 24H INSTAGRAM STYLE)
INSERT INTO momentos (id, author_id, media_url, text_note, expires_at)
VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
 'Café da manhã revisando notas sobre ergonomia cognitiva sem nenhuma notificação aberta. O silêncio cura.',
 NOW() + INTERVAL '22 hours'),

('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
 'Draft do ensaio sobre sobrecarga assíncrona finalizado. Menos mensagens fragmentadas, mais conversas com substância.',
 NOW() + INTERVAL '23 hours'),

('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
 'Primeiro sinal limpo no osciloscópio do novo sensor. 18µA de consumo médio.',
 NOW() + INTERVAL '20 hours'),

('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004',
 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
 'Luz matinal entrando no escritório. Um lembrete visual de que o trabalho não precisa ser caótico.',
 NOW() + INTERVAL '18 hours')
ON CONFLICT (id) DO NOTHING;

-- 5. CONVERSAS & MENSAGENS INICIAIS
INSERT INTO conversations (id, tab, participant_a_id, participant_b_id, subject, status, last_message_preview, last_message_at)
VALUES
('d0000000-0000-0000-0000-000000000001', 'direct', 
 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
 NULL, 'active', 'Li seu artigo sobre interfaces assíncronas. Achei fantástica a abordagem.', NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000002', 
 'Li seu artigo sobre interfaces assíncronas. Achei fantástica a abordagem sobre redução de fricção cognitiva.', 
 NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;
