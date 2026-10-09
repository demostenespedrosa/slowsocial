import React, { useState, useEffect } from 'react';
import {
  CURRENT_USER,
  INITIAL_POSTS,
  INITIAL_COMMUNITIES,
  INITIAL_TESTIMONIALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONVERSATIONS,
  INITIAL_MOMENTOS,
} from './data/mockData';
import { Post, Testimonial, AppNotification, Conversation, User, Momento } from './types';
import { useTheme } from './context/ThemeContext';

import { FeedView } from './views/FeedView';
import { ComunidadesView } from './views/ComunidadesView';
import { ComposerView } from './views/ComposerView';
import { PerfilView } from './views/PerfilView';
import { NotificacoesView } from './views/NotificacoesView';
import { MensagensView } from './views/MensagensView';
import { PwaInstallPrompt } from './components/ui/PwaInstallPrompt';

import {
  Compass,
  Users,
  Plus,
  Bell,
  User as UserIcon,
  Search,
  X,
} from 'lucide-react';

type Tab = 'feed' | 'comunidades' | 'notificacoes' | 'perfil' | 'mensagens';

export const App: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados Globais de Dados
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [communities] = useState(INITIAL_COMMUNITIES);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [momentos] = useState<Momento[]>(INITIAL_MOMENTOS);

  // Contadores
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  // Transição Suave de Telas Apple iOS sempre iniciando do Topo
  const handleSwitchTab = (tab: Tab) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        setActiveTab(tab);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    } else {
      setActiveTab(tab);
    }
  };

  // Assegura que toda troca de aba posicione a tela no topo absoluto
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Handlers do Feed
  const handleSavePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, savedByMe: !p.savedByMe, savedCount: p.savedByMe ? p.savedCount - 1 : p.savedCount + 1 }
          : p
      )
    );
  };

  const handleSupportPost = (postId: string) => {
    handleReactPost(postId, 'heart');
  };

  const handleReactPost = (postId: string, reactionType?: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const isSame = p.userReaction === reactionType;
        const newReaction = isSame ? undefined : reactionType;
        return {
          ...p,
          userReaction: newReaction,
          supportedByMe: Boolean(newReaction),
        };
      })
    );
  };

  const handleAddComment = (postId: string, commentText: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          responsesCount: p.responsesCount + 1,
          comments: [
            ...p.comments,
            {
              id: `c-${Date.now()}`,
              author: CURRENT_USER,
              content: commentText,
              createdAt: 'Agora',
            },
          ],
        };
      })
    );
  };

  const handleSubmitNewPost = (newPostData: Partial<Post>) => {
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: CURRENT_USER,
      source: 'conexoes',
      title: newPostData.title,
      content: newPostData.content || '',
      codeSnippet: newPostData.codeSnippet,
      attachments: newPostData.attachments,
      communityName: newPostData.communityName,
      privacy: newPostData.privacy || 'connections_only',
      responsesCount: 0,
      savedCount: 0,
      supportedByMe: false,
      savedByMe: false,
      createdAt: 'Agora mesmo',
      comments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    setActiveTab('feed');
  };

  // Handlers de Depoimentos
  const handleApproveTestimonial = (testId: string) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: 'approved' } : t))
    );
    setNotifications((prev) =>
      prev.map((n) => (n.testimonialId === testId ? { ...n, isRead: true } : n))
    );
  };

  const handleSubmitNewTestimonial = (content: string) => {
    const newTest: Testimonial = {
      id: `test-${Date.now()}`,
      fromUser: CURRENT_USER,
      toUserId: CURRENT_USER.id,
      content,
      createdAt: 'Hoje',
      status: 'pending',
    };
    setTestimonials((prev) => [...prev, newTest]);
  };

  // Handlers de Mensagens
  const handleAcceptDmRequest = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, tab: 'diretas', status: 'active', unread: false } : c))
    );
  };

  const handleArchiveDmRequest = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, status: 'archived' } : c))
    );
  };

  const handleSendMessage = (convId: string, content: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        return {
          ...c,
          lastMessage: content,
          lastMessageTime: 'Agora',
          messages: [
            ...c.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: CURRENT_USER.id,
              content,
              createdAt: 'Agora',
            },
          ],
        };
      })
    );
  };

  const handleOpenMessageWithUser = (targetUser: User) => {
    const existing = conversations.find((c) => c.participant.id === targetUser.id);
    if (!existing) {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        participant: targetUser,
        tab: 'diretas',
        status: 'active',
        unread: false,
        lastMessage: 'Início da conversa',
        lastMessageTime: 'Agora',
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
    }
    setActiveTab('mensagens');
  };

  return (
    <div
      className={`min-h-screen antialiased flex flex-col justify-start transition-colors ${
        isDark
          ? 'bg-[#000000] text-white selection:bg-[#A390E4]/30 selection:text-white'
          : 'bg-[#F2F2F7] text-black selection:bg-[#7C65C1]/25 selection:text-black'
      }`}
    >
      {/* Lembrete / Banner Inteligente de Instalação PWA */}
      <PwaInstallPrompt />

      {/* Visualização Principal com Transição Fluida Apple iOS */}
      <main className="flex-1">
        <div key={activeTab} className="animate-view-enter w-full">
          {activeTab === 'feed' && (
            <FeedView
              currentUser={CURRENT_USER}
              momentos={momentos}
              posts={posts}
              onOpenMessages={() => handleSwitchTab('mensagens')}
              onOpenComposer={() => setIsComposerOpen(true)}
              onSearchClick={() => setIsSearchOpen(true)}
              onSavePost={handleSavePost}
              onSupportPost={handleSupportPost}
              onReactPost={handleReactPost}
              onAddComment={handleAddComment}
            />
          )}

          {activeTab === 'comunidades' && (
            <ComunidadesView
              communities={communities}
              onOpenCreateCommunity={() => setIsComposerOpen(true)}
              onExploreCommunities={() => setIsSearchOpen(true)}
            />
          )}

          {activeTab === 'perfil' && (
            <PerfilView
              user={CURRENT_USER}
              testimonials={testimonials}
              userPosts={posts.filter((p) => p.author.id === CURRENT_USER.id)}
              communities={communities}
              onOpenMessageWithUser={handleOpenMessageWithUser}
              onApproveTestimonial={handleApproveTestimonial}
              onSubmitNewTestimonial={handleSubmitNewTestimonial}
            />
          )}

          {activeTab === 'notificacoes' && (
            <NotificacoesView
              notifications={notifications}
              onOpenTestimonialReview={(testId) => {
                handleApproveTestimonial(testId);
                handleSwitchTab('perfil');
              }}
              onAcceptConnection={(notifId) => {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === notifId ? { ...n, isRead: true, connectionStatus: 'accepted' } : n
                  )
                );
              }}
              onIgnoreConnection={(notifId) => {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === notifId ? { ...n, isRead: true, connectionStatus: 'ignored' } : n
                  )
                );
              }}
              onMarkAllAsRead={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
              }}
              onToggleRead={(notifId) => {
                setNotifications((prev) =>
                  prev.map((n) => (n.id === notifId ? { ...n, isRead: !n.isRead } : n))
                );
              }}
              onNavigateToFeed={() => handleSwitchTab('feed')}
            />
          )}

          {activeTab === 'mensagens' && (
            <MensagensView
              conversations={conversations}
              onBack={() => handleSwitchTab('feed')}
              onAcceptRequest={handleAcceptDmRequest}
              onArchiveRequest={handleArchiveDmRequest}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>
      </main>

      {/* Barra de Navegação Inferior Nativa Apple iOS */}
      <nav
        aria-label="Barra Principal de Navegação"
        className={`fixed bottom-0 inset-x-0 z-40 backdrop-blur-2xl transition-colors ${
          isDark
            ? 'bg-[#121214]/85 border-t border-white/[0.08]'
            : 'bg-white/85 border-t border-black/[0.08]'
        } pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5`}
      >
        <div className="max-w-md mx-auto px-3 flex items-center justify-between">
          {/* 1. Feed */}
          <button
            onClick={() => handleSwitchTab('feed')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-90 ${
              activeTab === 'feed'
                ? isDark
                  ? 'text-[#A390E4]'
                  : 'text-[#7C65C1]'
                : isDark
                ? 'text-[#8E8E93] hover:text-[#D1D1D6]'
                : 'text-[#8E8E93] hover:text-[#3C3C43]'
            }`}
            aria-label="Feed Principal"
          >
            <Compass size={22} strokeWidth={activeTab === 'feed' ? 2.5 : 1.8} />
            <span
              className={`text-[10px] sm:text-[11px] tracking-tight mt-0.5 ${
                activeTab === 'feed' ? 'font-semibold' : 'font-medium'
              }`}
            >
              Feed
            </span>
          </button>

          {/* 2. Comunidades */}
          <button
            onClick={() => handleSwitchTab('comunidades')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-90 ${
              activeTab === 'comunidades'
                ? isDark
                  ? 'text-[#A390E4]'
                  : 'text-[#7C65C1]'
                : isDark
                ? 'text-[#8E8E93] hover:text-[#D1D1D6]'
                : 'text-[#8E8E93] hover:text-[#3C3C43]'
            }`}
            aria-label="Comunidades"
          >
            <Users size={22} strokeWidth={activeTab === 'comunidades' ? 2.5 : 1.8} />
            <span
              className={`text-[10px] sm:text-[11px] tracking-tight mt-0.5 ${
                activeTab === 'comunidades' ? 'font-semibold' : 'font-medium'
              }`}
            >
              Comunidades
            </span>
          </button>

          {/* 3. Publicar (Hero Action Button Central) */}
          <button
            onClick={() => setIsComposerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center -mt-3.5 group active:scale-90 transition-transform"
            title="Publicar novo conteúdo ou momento"
            aria-label="Publicar novo conteúdo"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all shadow-[0_6px_20px_rgba(124,101,193,0.38)] ring-4 ${
                isDark
                  ? 'bg-gradient-to-tr from-[#8E79D0] to-[#A390E4] ring-[#121214]'
                  : 'bg-gradient-to-tr from-[#6C55B1] to-[#7C65C1] ring-white'
              }`}
            >
              <Plus size={22} strokeWidth={2.6} />
            </div>
            <span
              className={`text-[10px] sm:text-[11px] font-semibold tracking-tight mt-1 transition-colors ${
                isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'
              }`}
            >
              Publicar
            </span>
          </button>

          {/* 4. Notificações */}
          <button
            onClick={() => handleSwitchTab('notificacoes')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-90 ${
              activeTab === 'notificacoes'
                ? isDark
                  ? 'text-[#A390E4]'
                  : 'text-[#7C65C1]'
                : isDark
                ? 'text-[#8E8E93] hover:text-[#D1D1D6]'
                : 'text-[#8E8E93] hover:text-[#3C3C43]'
            }`}
            aria-label="Notificações"
          >
            <div className="relative">
              <Bell size={22} strokeWidth={activeTab === 'notificacoes' ? 2.5 : 1.8} />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF453A] ring-2 ring-white dark:ring-[#121214]" />
              )}
            </div>
            <span
              className={`text-[10px] sm:text-[11px] tracking-tight mt-0.5 ${
                activeTab === 'notificacoes' ? 'font-semibold' : 'font-medium'
              }`}
            >
              Notificações
            </span>
          </button>

          {/* 5. Perfil */}
          <button
            onClick={() => handleSwitchTab('perfil')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-90 ${
              activeTab === 'perfil'
                ? isDark
                  ? 'text-[#A390E4]'
                  : 'text-[#7C65C1]'
                : isDark
                ? 'text-[#8E8E93] hover:text-[#D1D1D6]'
                : 'text-[#8E8E93] hover:text-[#3C3C43]'
            }`}
            aria-label="Perfil do Usuário"
          >
            <UserIcon size={22} strokeWidth={activeTab === 'perfil' ? 2.5 : 1.8} />
            <span
              className={`text-[10px] sm:text-[11px] tracking-tight mt-0.5 ${
                activeTab === 'perfil' ? 'font-semibold' : 'font-medium'
              }`}
            >
              Perfil
            </span>
          </button>
        </div>
      </nav>

      {/* Modal: Composer */}
      {isComposerOpen && (
        <ComposerView
          communities={communities}
          onClose={() => setIsComposerOpen(false)}
          onSubmitPost={handleSubmitNewPost}
        />
      )}

      {/* Modal: Busca Global Command Palette */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/60 backdrop-blur-md">
          <div
            className={`border rounded-[28px] w-full max-w-lg p-5 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-black/10'
            }`}
          >
            <div
              className={`flex items-center gap-3 border rounded-[16px] px-4 py-3 ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] focus-within:border-[#A390E4]'
                  : 'bg-[#F2F2F7] border-black/[0.06] focus-within:border-[#7C65C1]'
              }`}
            >
              <Search size={18} className={isDark ? 'text-[#8E8E93]' : 'text-[#636366]'} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar pessoas, tópicos ou comunidades..."
                className={`bg-transparent flex-1 text-[15px] focus:outline-none placeholder-[#8E8E93] ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className={isDark ? 'text-[#8E8E93] hover:text-white' : 'text-[#636366] hover:text-black'}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-[14px]">
              <span className={`text-[12px] font-bold uppercase tracking-wider px-1 ${
                isDark ? 'text-[#8E8E93]' : 'text-[#636366]'
              }`}>
                Acesso Rápido
              </span>
              <div className="space-y-1.5">
                <div
                  onClick={() => {
                    setIsSearchOpen(false);
                    setActiveTab('comunidades');
                  }}
                  className={`p-3.5 rounded-[16px] cursor-pointer flex items-center justify-between transition-colors border ${
                    isDark
                      ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] border-white/[0.04]'
                      : 'bg-[#F2F2F7] hover:bg-[#E5E5EA] border-black/[0.04]'
                  }`}
                >
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Sistemas & Baixo Nível</span>
                  <span className={`text-[12px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>Comunidade</span>
                </div>
                <div
                  onClick={() => {
                    setIsSearchOpen(false);
                    setActiveTab('perfil');
                  }}
                  className={`p-3.5 rounded-[16px] cursor-pointer flex items-center justify-between transition-colors border ${
                    isDark
                      ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] border-white/[0.04]'
                      : 'bg-[#F2F2F7] hover:bg-[#E5E5EA] border-black/[0.04]'
                  }`}
                >
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Alice Liddell</span>
                  <span className={`text-[12px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>Conexão de 1º grau</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
