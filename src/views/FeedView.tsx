import React, { useState, useEffect } from 'react';
import { Post, User, Momento, AspectRatio } from '../types';
import { Badge } from '../components/ui/Badge';
import { MomentosBar } from '../components/MomentosBar';
import { AnimatedReaction } from '../components/ui/AnimatedReaction';
import { useTheme } from '../context/ThemeContext';
import {
  MessageSquare,
  Bookmark,
  Share2,
  Heart,
  Send,
  Code2,
  FileText,
  Sparkles,
  X,
  Copy,
  Check,
  MoreHorizontal,
  CornerDownRight,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Mic,
  Film,
} from 'lucide-react';

interface FeedViewProps {
  currentUser: User;
  momentos: Momento[];
  posts: Post[];
  onOpenMessages: () => void;
  onOpenComposer: () => void;
  onSearchClick: () => void;
  onSavePost: (postId: string) => void;
  onSupportPost: (postId: string) => void;
  onReactPost?: (postId: string, reactionType?: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
}

interface ReactionItem {
  id: string;
  emoji: string;
  label: string;
  activeText: string;
  activeBg: string;
}

const REACTION_OPTIONS: ReactionItem[] = [
  { id: 'heart', emoji: '❤️', label: 'Curtir', activeText: 'text-[#FF453A]', activeBg: 'bg-[#FF453A]/15' },
  { id: 'clap', emoji: '👏', label: 'Parabéns', activeText: 'text-[#D4A359]', activeBg: 'bg-[#D4A359]/15' },
  { id: 'lightbulb', emoji: '💡', label: 'Genial', activeText: 'text-[#FFD60A]', activeBg: 'bg-[#FFD60A]/15' },
  { id: 'handshake', emoji: '🤝', label: 'Apoiado', activeText: 'text-[#30D158]', activeBg: 'bg-[#30D158]/15' },
  { id: 'fire', emoji: '🔥', label: 'Inspirador', activeText: 'text-[#FF9F0A]', activeBg: 'bg-[#FF9F0A]/15' },
  { id: 'thinking', emoji: '🤔', label: 'Reflexivo', activeText: 'text-[#7C65C1] dark:text-[#A390E4]', activeBg: 'bg-[#7C65C1]/15 dark:bg-[#A390E4]/20' },
];

export const FeedView: React.FC<FeedViewProps> = ({
  currentUser,
  momentos,
  posts,
  onOpenMessages,
  onOpenComposer,
  onSearchClick,
  onSavePost,
  onSupportPost,
  onReactPost,
  onAddComment,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'conexoes' | 'radar'>('conexoes');

  // Popover de Reações
  const [activeReactionPopoverPostId, setActiveReactionPopoverPostId] = useState<string | null>(null);

  // Bottom Sheet Modal de Comentários
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [modalCommentText, setModalCommentText] = useState('');
  const [replyingToAuthor, setReplyingToAuthor] = useState<string | null>(null);

  // Compartilhar com Nota & Feedback
  const [quoteNotePost, setQuoteNotePost] = useState<Post | null>(null);
  const [quoteText, setQuoteText] = useState('');
  const [copiedLinkPostId, setCopiedLinkPostId] = useState<string | null>(null);

  // Menu de opções (3 pontinhos)
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Estados dos Novos Formatos de Postagem
  // 1. Carrossel de fotos (slide atual por post)
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});

  // 2. Player de Áudio / Voice Memo
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [audioSpeed, setAudioSpeed] = useState<Record<string, number>>({});

  // 3. Player de Vídeo
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});
  const [mutedVideos, setMutedVideos] = useState<Record<string, boolean>>({});

  // 4. Texto Longo (Expandir / Recolher)
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  // Simulação de reprodução de áudio ao vivo
  useEffect(() => {
    if (!playingAudioId) return;
    const currentSpeed = audioSpeed[playingAudioId] || 1;
    const interval = setInterval(() => {
      setAudioProgress((prev) => {
        const current = prev[playingAudioId] || 0;
        if (current >= 100) {
          setPlayingAudioId(null);
          return { ...prev, [playingAudioId]: 0 };
        }
        return { ...prev, [playingAudioId]: Math.min(100, current + 2.5 * currentSpeed) };
      });
    }, 200);
    return () => clearInterval(interval);
  }, [playingAudioId, audioSpeed]);

  // Simulação de reprodução de vídeo ao vivo
  useEffect(() => {
    if (!playingVideoId) return;
    const interval = setInterval(() => {
      setVideoProgress((prev) => {
        const current = prev[playingVideoId] || 0;
        if (current >= 100) {
          setPlayingVideoId(null);
          return { ...prev, [playingVideoId]: 0 };
        }
        return { ...prev, [playingVideoId]: Math.min(100, current + 3.5) };
      });
    }, 250);
    return () => clearInterval(interval);
  }, [playingVideoId]);

  const filteredPosts = posts.filter((p) => p.source === activeTab);
  const activeCommentsPost = posts.find((p) => p.id === activeCommentsPostId);

  const handleSelectReaction = (postId: string, reactionId: string) => {
    if (onReactPost) {
      onReactPost(postId, reactionId);
    } else {
      onSupportPost(postId);
    }
    setActiveReactionPopoverPostId(null);
  };

  const handleSendModalComment = (postId: string) => {
    if (!modalCommentText.trim()) return;
    const finalContent = replyingToAuthor
      ? `@${replyingToAuthor} ${modalCommentText.trim()}`
      : modalCommentText.trim();

    onAddComment(postId, finalContent);
    setModalCommentText('');
    setReplyingToAuthor(null);
  };

  const handleCopyLink = (postId: string) => {
    navigator.clipboard?.writeText(`https://slowsocial.app/post/${postId}`);
    setCopiedLinkPostId(postId);
    setTimeout(() => {
      setCopiedLinkPostId(null);
      setActiveMenuPostId(null);
    }, 2000);
  };

  const toggleExpandPost = (postId: string) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handlePrevSlide = (postId: string, total: number) => {
    setCarouselIndices((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + total) % total,
    }));
  };

  const handleNextSlide = (postId: string, total: number) => {
    setCarouselIndices((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % total,
    }));
  };

  const togglePlayAudio = (postId: string) => {
    setPlayingAudioId((prev) => (prev === postId ? null : postId));
  };

  const toggleAudioSpeed = (postId: string) => {
    setAudioSpeed((prev) => {
      const current = prev[postId] || 1;
      const next = current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
      return { ...prev, [postId]: next };
    });
  };

  const togglePlayVideo = (postId: string) => {
    setPlayingVideoId((prev) => (prev === postId ? null : postId));
  };

  const toggleMuteVideo = (postId: string) => {
    setMutedVideos((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const calculateElapsed = (durationStr: string, percentage: number) => {
    const parts = durationStr.split(':').map(Number);
    const totalSecs = parts.length === 2 ? parts[0] * 60 + parts[1] : 60;
    const currentSecs = Math.floor((totalSecs * (percentage || 0)) / 100);
    const m = Math.floor(currentSecs / 60);
    const s = currentSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getAspectRatioContainerClass = (ratio?: AspectRatio) => {
    switch (ratio) {
      case '1:1':
        return 'aspect-square w-full';
      case '3:4':
        return 'aspect-[3/4] w-full max-w-[440px] mx-auto';
      case '9:16':
        return 'aspect-[9/16] w-full max-h-[520px] max-w-[320px] mx-auto';
      case '16:9':
      default:
        return 'aspect-video w-full';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-36 pt-3 sm:pt-4">
      {/* 1. Navbar Superior: Apenas Logo, Título, Pesquisar e Mensagens */}
      <header className="flex items-center justify-between mb-5 pt-1">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-[13px] flex items-center justify-center font-bold text-base transition-colors ${
              isDark
                ? 'bg-[#A390E4]/15 border border-[#A390E4]/30 text-[#D2C7F5]'
                : 'bg-[#7C65C1]/12 border border-[#7C65C1]/25 text-[#5E47A3]'
            }`}
          >
            S
          </div>
          <h1
            className={`text-[21px] sm:text-[22px] font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            SlowSocial
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSearchClick}
            className={`p-2.5 rounded-full border transition-all active:scale-95 ${
              isDark
                ? 'bg-[#1C1C1E] border-white/[0.08] text-[#8E8E93] hover:text-white'
                : 'bg-white border-black/[0.06] text-[#636366] hover:text-black shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            }`}
            title="Buscar no SlowSocial"
          >
            <Search size={18} />
          </button>

          <button
            onClick={onOpenMessages}
            className={`relative p-2.5 rounded-full border transition-all active:scale-95 ${
              isDark
                ? 'bg-[#1C1C1E] border-white/[0.08] text-[#8E8E93] hover:text-white'
                : 'bg-white border-black/[0.06] text-[#636366] hover:text-black shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            }`}
            title="Mensagens Diretas"
          >
            <MessageSquare size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF453A]" />
          </button>
        </div>
      </header>

      {/* 2. Barra de Momentos (24h de conexões) */}
      <MomentosBar
        currentUser={currentUser}
        momentos={momentos}
        onAddMomento={onOpenComposer}
      />

      {/* 3. Seletor de Abas do Feed Refinado, Fluido e Integrado (Sem caixas fechadas) */}
      <div
        className={`flex items-center gap-8 border-b mb-6 px-1 transition-colors ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.06]'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('conexoes')}
          className={`relative pb-3 text-[16px] sm:text-[17px] transition-all duration-200 flex items-center gap-2 select-none active:scale-[0.98] ${
            activeTab === 'conexoes'
              ? isDark
                ? 'text-white font-bold'
                : 'text-black font-bold'
              : isDark
              ? 'text-[#8E8E93] font-medium hover:text-white'
              : 'text-[#8E8E93] font-medium hover:text-black'
          }`}
        >
          <span>Minhas Conexões</span>
          {activeTab === 'conexoes' && (
            <div
              className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-full transition-all ${
                isDark ? 'bg-[#A390E4]' : 'bg-[#7C65C1]'
              }`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`relative pb-3 text-[16px] sm:text-[17px] transition-all duration-200 flex items-center gap-2 select-none active:scale-[0.98] ${
            activeTab === 'radar'
              ? isDark
                ? 'text-white font-bold'
                : 'text-black font-bold'
              : isDark
              ? 'text-[#8E8E93] font-medium hover:text-white'
              : 'text-[#8E8E93] font-medium hover:text-black'
          }`}
        >
          <span>Interesses</span>
          {activeTab === 'radar' && (
            <div
              className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-full transition-all ${
                isDark ? 'bg-[#A390E4]' : 'bg-[#7C65C1]'
              }`}
            />
          )}
        </button>
      </div>

      {/* 4. Stream de Postagens Estilo Apple Inset Grouped com Transição Fluida */}
      <div key={activeTab} className="space-y-4 sm:space-y-5 animate-view-enter">
        {filteredPosts.map((post) => {
          const userReactionObj = REACTION_OPTIONS.find((r) => r.id === post.userReaction);
          const isReactionPopoverOpen = activeReactionPopoverPostId === post.id;
          const isMenuOpen = activeMenuPostId === post.id;

          return (
            <article
              key={post.id}
              className={`rounded-[24px] p-5 sm:p-6 border transition-all duration-200 space-y-4 hover:-translate-y-0.5 ${
                isDark
                  ? 'bg-[#1C1C1E] border-white/[0.08] hover:border-white/[0.14] hover:shadow-[0_8px_28px_rgba(0,0,0,0.5)]'
                  : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]'
              }`}
            >
              {/* Contexto Social do Radar */}
              {post.source === 'radar' && post.radarContext && (
                <div
                  className={`flex items-center gap-2 text-[13px] font-medium px-3.5 py-1.5 rounded-full border ${
                    isDark
                      ? 'bg-[#A390E4]/12 border-[#A390E4]/25 text-[#D2C7F5]'
                      : 'bg-[#7C65C1]/10 border-[#7C65C1]/20 text-[#5E47A3]'
                  }`}
                >
                  <Sparkles size={14} className="shrink-0" />
                  <span className="truncate">
                    {post.radarContext.connectionsDebating.map((c) => c.name).join(', ')}{' '}
                    {post.radarContext.extraCount > 0 && `e mais ${post.radarContext.extraCount} conexões`}{' '}
                    estão debatendo este tópico
                  </span>
                </div>
              )}

              {/* Cabeçalho do Card: Avatar, Nome, Grau, Comunidade, Horário e Menu */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[16px] font-bold tracking-tight ${
                          isDark ? 'text-white' : 'text-black'
                        }`}
                      >
                        {post.author.name}
                      </span>
                      <Badge type={post.author.degree} />
                      {post.communityName && (
                        <span
                          className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full border ${
                            isDark
                              ? 'text-[#8E8E93] bg-white/[0.04] border-white/[0.08]'
                              : 'text-[#636366] bg-black/[0.04] border-black/[0.08]'
                          }`}
                        >
                          {post.communityName}
                        </span>
                      )}
                    </div>
                    <p className={`text-[13px] line-clamp-1 ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                      {post.author.headline} · {post.createdAt}
                    </p>
                  </div>
                </div>

                {/* Menu 3 Pontinhos */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveMenuPostId(isMenuOpen ? null : post.id)}
                    className={`p-2 rounded-full transition-colors ${
                      isDark
                        ? 'text-[#8E8E93] hover:text-white hover:bg-white/[0.08]'
                        : 'text-[#8E8E93] hover:text-black hover:bg-black/[0.05]'
                    }`}
                    title="Mais opções"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {isMenuOpen && (
                    <div
                      className={`absolute right-0 top-9 z-20 w-48 rounded-[18px] p-1.5 shadow-2xl text-[14px] border ${
                        isDark
                          ? 'bg-[#2C2C2E] border-white/10 shadow-black/80'
                          : 'bg-white border-black/10 shadow-black/10'
                      }`}
                    >
                      <button
                        onClick={() => handleCopyLink(post.id)}
                        className={`w-full px-3 py-2 text-left rounded-[12px] flex items-center gap-2.5 transition-colors ${
                          isDark
                            ? 'hover:bg-white/[0.08] text-white'
                            : 'hover:bg-black/[0.04] text-black'
                        }`}
                      >
                        {copiedLinkPostId === post.id ? (
                          <Check size={15} className="text-[#30D158]" />
                        ) : (
                          <Copy size={15} />
                        )}
                        <span>{copiedLinkPostId === post.id ? 'Copiado!' : 'Copiar link'}</span>
                      </button>
                      <button
                        onClick={() => {
                          onSavePost(post.id);
                          setActiveMenuPostId(null);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-[12px] flex items-center gap-2.5 transition-colors ${
                          isDark
                            ? 'hover:bg-white/[0.08] text-white'
                            : 'hover:bg-black/[0.04] text-black'
                        }`}
                      >
                        <Bookmark size={15} />
                        <span>{post.savedByMe ? 'Remover do Caderno' : 'Salvar no Caderno'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. Formato: Texto Curto (Estilo Twitter / Threads / X) */}
              {post.postType === 'text_short' && (
                <div className="py-1">
                  <p
                    className={`text-[19px] sm:text-[21px] font-normal leading-[1.65] tracking-tight ${
                      isDark ? 'text-[#F2F2F7]' : 'text-[#111113]'
                    }`}
                  >
                    {post.content}
                  </p>
                </div>
              )}

              {/* 2. Formato: Texto Longo (Estilo LinkedIn / Crônica com Ler Mais) */}
              {post.postType === 'text_long' && (
                <div className="space-y-3">
                  {post.title && (
                    <h2
                      className={`text-[20px] sm:text-[22px] font-bold tracking-tight leading-snug ${
                        isDark ? 'text-white' : 'text-black'
                      }`}
                    >
                      {post.title}
                    </h2>
                  )}
                  <div className="relative space-y-2">
                    <div
                      className={`text-[16px] sm:text-[17px] leading-[1.75] font-normal whitespace-pre-line transition-all ${
                        isDark ? 'text-[#E5E5EA]' : 'text-[#1C1C1E]'
                      } ${!expandedPosts[post.id] ? 'line-clamp-4' : ''}`}
                    >
                      {post.content}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpandPost(post.id)}
                      className={`inline-flex items-center gap-1.5 text-[14px] font-semibold transition-colors pt-1 ${
                        isDark ? 'text-[#A390E4] hover:text-white' : 'text-[#7C65C1] hover:text-black'
                      }`}
                    >
                      {expandedPosts[post.id] ? (
                        <>
                          <span>Recolher reflexão</span>
                          <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          <span>Ler reflexão completa...</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Título e Conteúdo para os demais formatos */}
              {post.postType !== 'text_short' && post.postType !== 'text_long' && (
                <>
                  {post.title && (
                    <h2
                      className={`text-[19px] sm:text-[21px] font-bold tracking-tight leading-snug ${
                        isDark ? 'text-white' : 'text-black'
                      }`}
                    >
                      {post.title}
                    </h2>
                  )}

                  {post.content && (
                    <div
                      className={`text-[16px] sm:text-[17px] leading-[1.65] font-normal whitespace-pre-line ${
                        isDark ? 'text-[#E5E5EA]' : 'text-[#1C1C1E]'
                      }`}
                    >
                      {post.content}
                    </div>
                  )}
                </>
              )}

              {/* 4. Carrossel estilo Instagram (Multi-mídia) */}
              {post.carousel && post.carousel.length > 0 && (() => {
                const currentSlide = carouselIndices[post.id] || 0;
                const totalSlides = post.carousel.length;
                const activeSlide = post.carousel[currentSlide] || post.carousel[0];

                return (
                  <div className="space-y-2">
                    <div className="relative rounded-[20px] overflow-hidden border border-black/[0.06] dark:border-white/[0.08] select-none group aspect-square w-full bg-black/5 dark:bg-black/30">
                      {/* Imagem do Slide */}
                      <img
                        src={activeSlide.url}
                        alt={activeSlide.caption || `Foto ${currentSlide + 1}`}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />

                      {/* Badge Superior: Contador 1/4 e Ícone de Camadas */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[12px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 z-10">
                        <Layers size={13} />
                        <span>{currentSlide + 1}/{totalSlides}</span>
                      </div>

                      {/* Seta Anterior */}
                      {currentSlide > 0 && (
                        <button
                          type="button"
                          onClick={() => handlePrevSlide(post.id, totalSlides)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/65 active:scale-95 transition-all shadow-lg z-10"
                          aria-label="Slide anterior"
                        >
                          <ChevronLeft size={20} />
                        </button>
                      )}

                      {/* Seta Próximo */}
                      {currentSlide < totalSlides - 1 && (
                        <button
                          type="button"
                          onClick={() => handleNextSlide(post.id, totalSlides)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/65 active:scale-95 transition-all shadow-lg z-10"
                          aria-label="Próximo slide"
                        >
                          <ChevronRight size={20} />
                        </button>
                      )}

                      {/* Indicadores de Ponto (Dots) */}
                      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
                        {post.carousel.map((_, idx) => (
                          <span
                            key={idx}
                            className={`transition-all duration-200 rounded-full ${
                              idx === currentSlide
                                ? 'w-5 h-1.5 bg-white shadow-sm'
                                : 'w-1.5 h-1.5 bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Legenda do Slide Atual */}
                    {activeSlide.caption && (
                      <p className={`text-[13px] px-1 font-medium ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                        {activeSlide.caption}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* 5. Mídia Única: Imagem com Proporção (1:1, 3:4, 9:16, 16:9) */}
              {post.media && post.media.type === 'image' && (
                <div className="space-y-2">
                  <div
                    className={`relative rounded-[20px] overflow-hidden border ${
                      isDark ? 'border-white/[0.08] bg-[#121214]' : 'border-black/[0.06] bg-[#F2F2F7]'
                    } ${getAspectRatioContainerClass(post.media.aspectRatio)}`}
                  >
                    <img
                      src={post.media.url}
                      alt={post.media.caption || post.title || 'Foto do post'}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
                      loading="lazy"
                    />

                    {/* Badge da Proporção */}
                    <div className="absolute top-3 left-3 bg-black/55 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      {post.media.aspectRatio}
                    </div>

                    {post.media.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 pt-6 text-white text-[12.5px] font-medium leading-snug">
                        {post.media.caption}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. Mídia Única: Vídeo com Proporção (1:1, 3:4, 9:16, 16:9) e Controles Interativos */}
              {post.media && post.media.type === 'video' && (() => {
                const isVideoPlaying = playingVideoId === post.id;
                const currentVideoProgress = videoProgress[post.id] || 0;
                const isMuted = mutedVideos[post.id] ?? false;

                return (
                  <div className="space-y-2">
                    <div
                      className={`relative rounded-[20px] overflow-hidden border group select-none ${
                        isDark ? 'border-white/[0.08] bg-black' : 'border-black/[0.06] bg-black'
                      } ${getAspectRatioContainerClass(post.media.aspectRatio)}`}
                    >
                      {/* Frame / Poster do Vídeo */}
                      <img
                        src={post.media.url}
                        alt="Vídeo preview"
                        className="w-full h-full object-cover opacity-90 transition-transform duration-300"
                      />

                      {/* Badge Superior do Formato */}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 z-10">
                        <Film size={12} />
                        <span>Vídeo · {post.media.aspectRatio}</span>
                      </div>

                      {/* Botão Central de Play / Pause */}
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <button
                          type="button"
                          onClick={() => togglePlayVideo(post.id)}
                          className="w-14 h-14 rounded-full bg-black/55 backdrop-blur-xl text-white flex items-center justify-center shadow-2xl active:scale-90 hover:bg-black/75 transition-all duration-200"
                          aria-label={isVideoPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                        >
                          {isVideoPlaying ? (
                            <Pause size={22} fill="currentColor" />
                          ) : (
                            <Play size={22} fill="currentColor" className="ml-1" />
                          )}
                        </button>
                      </div>

                      {/* Barra de Controles Inferior */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-8 z-10 space-y-2">
                        {/* Scrubber de Progresso */}
                        <div
                          className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer relative"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                            setVideoProgress((p) => ({ ...p, [post.id]: pct }));
                            if (!isVideoPlaying) setPlayingVideoId(post.id);
                          }}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-[#7C65C1] to-[#A390E4] rounded-full transition-all duration-150"
                            style={{ width: `${currentVideoProgress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-white text-[12px] font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => togglePlayVideo(post.id)}
                              className="hover:text-[#A390E4] transition-colors"
                            >
                              {isVideoPlaying ? <Pause size={15} /> : <Play size={15} />}
                            </button>
                            <span className="font-mono text-[11px]">
                              {calculateElapsed(post.media.duration || '0:30', currentVideoProgress)} / {post.media.duration || '0:30'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {post.media.caption && (
                              <span className="text-white/80 line-clamp-1 max-w-[180px] text-[11.5px]">
                                {post.media.caption}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleMuteVideo(post.id)}
                              className="p-1 rounded-full hover:bg-white/20 transition-colors"
                              title={isMuted ? 'Ativar áudio' : 'Desativar áudio'}
                            >
                              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 7. Áudio: Voice Memo com Waveform Interativo e Controles */}
              {post.audio && (() => {
                const audioData = post.audio;
                if (!audioData) return null;

                const isAudioPlaying = playingAudioId === post.id;
                const currentAudioProgress = audioProgress[post.id] || 0;
                const currentAudioSpeed = audioSpeed[post.id] || 1;

                return (
                  <div
                    className={`rounded-[22px] p-4 sm:p-5 border transition-all ${
                      isDark
                        ? 'bg-[#A390E4]/[0.08] border-[#A390E4]/25'
                        : 'bg-[#7C65C1]/[0.05] border-[#7C65C1]/20 shadow-[0_2px_12px_rgba(124,101,193,0.06)]'
                    }`}
                  >
                    {/* Header do Card de Áudio */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-full ${
                            isDark ? 'bg-[#A390E4]/20 text-[#A390E4]' : 'bg-[#7C65C1]/15 text-[#7C65C1]'
                          }`}
                        >
                          <Mic size={15} />
                        </div>
                        <span className={`text-[13px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                          {audioData.title || 'Nota de Voz'}
                        </span>
                      </div>

                      {/* Botão de Velocidade (1x / 1.5x / 2x) */}
                      <button
                        type="button"
                        onClick={() => toggleAudioSpeed(post.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
                          isDark
                            ? 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                            : 'bg-white hover:bg-stone-50 text-black border-black/10 shadow-xs'
                        }`}
                        title="Alterar velocidade de reprodução"
                      >
                        {currentAudioSpeed}x
                      </button>
                    </div>

                    {/* Player: Botão Circular + Waveform Interativo */}
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      {/* Botão Play / Pause em Lilás Apple */}
                      <button
                        type="button"
                        onClick={() => togglePlayAudio(post.id)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-md active:scale-90 transition-all ${
                          isDark
                            ? 'bg-gradient-to-tr from-[#8E79D0] to-[#A390E4] hover:shadow-[0_4px_16px_rgba(163,144,228,0.4)]'
                            : 'bg-gradient-to-tr from-[#6C55B1] to-[#7C65C1] hover:shadow-[0_4px_16px_rgba(124,101,193,0.35)]'
                        }`}
                        aria-label={isAudioPlaying ? 'Pausar áudio' : 'Ouvir áudio'}
                      >
                        {isAudioPlaying ? (
                          <Pause size={20} fill="currentColor" />
                        ) : (
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>

                      {/* Waveform Interativo */}
                      <div className="flex-1 flex flex-col justify-center space-y-2 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-1.5 h-10 w-full cursor-pointer py-1">
                          {audioData.waveform.map((heightPercent, idx) => {
                            const barProgress = (idx / audioData.waveform.length) * 100;
                            const isPassed = currentAudioProgress >= barProgress;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setAudioProgress((p) => ({ ...p, [post.id]: barProgress }));
                                  if (!isAudioPlaying) setPlayingAudioId(post.id);
                                }}
                                className="flex-1 h-full flex items-center justify-center group/bar focus:outline-none"
                                title={`Pular para ${Math.round(barProgress)}%`}
                              >
                                <span
                                  className={`w-full max-w-[4px] rounded-full transition-all duration-150 ${
                                    isPassed
                                      ? isDark
                                        ? 'bg-[#A390E4]'
                                        : 'bg-[#7C65C1]'
                                      : isDark
                                      ? 'bg-white/20 group-hover/bar:bg-white/40'
                                      : 'bg-black/15 group-hover/bar:bg-black/30'
                                  }`}
                                  style={{
                                    height: `${Math.max(15, heightPercent)}%`,
                                  }}
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Tempo: Decorrido vs Total */}
                        <div className="flex items-center justify-between text-[11.5px] font-mono font-medium">
                          <span className={isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'}>
                            {calculateElapsed(audioData.duration, currentAudioProgress)}
                          </span>
                          <span className={isDark ? 'text-[#8E8E93]' : 'text-[#8E8E93]'}>
                            {audioData.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Bloco de Código Técnico */}
              {post.codeSnippet && (
                <div
                  className={`rounded-[18px] p-4 font-mono text-[13.5px] overflow-x-auto border ${
                    isDark
                      ? 'bg-[#000000] border-white/[0.08]'
                      : 'bg-[#F2F2F7] border-black/[0.06]'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between text-[12px] pb-2 mb-2 border-b ${
                      isDark
                        ? 'text-[#8E8E93] border-white/[0.08]'
                        : 'text-[#636366] border-black/[0.06]'
                    }`}
                  >
                    <span
                      className={`flex items-center gap-1.5 font-bold ${
                        isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'
                      }`}
                    >
                      <Code2 size={14} /> {post.codeSnippet.language.toUpperCase()}
                    </span>
                    <span>Código Formatado</span>
                  </div>
                  <pre className={isDark ? 'text-[#30D158]' : 'text-[#1E7E34]'}>
                    <code>{post.codeSnippet.code}</code>
                  </pre>
                </div>
              )}

              {/* Anexo de Arquivo */}
              {post.attachments && post.attachments.type === 'file' && (
                <div
                  className={`rounded-[18px] p-4 flex items-center justify-between border ${
                    isDark
                      ? 'bg-[#2C2C2E] border-white/[0.08]'
                      : 'bg-[#F2F2F7] border-black/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-[12px] ${
                        isDark
                          ? 'bg-[#A390E4]/15 text-[#D2C7F5]'
                          : 'bg-[#7C65C1]/12 text-[#5E47A3]'
                      }`}
                    >
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className={`text-[14px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                        {post.attachments.fileName}
                      </p>
                      <p className={`text-[12px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                        {post.attachments.fileSize} · Esquema técnico
                      </p>
                    </div>
                  </div>
                  <button
                    className={`px-3.5 py-1.5 rounded-[12px] text-[13px] font-semibold transition-all ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-white hover:bg-stone-100 text-black shadow-xs'
                    }`}
                  >
                    Baixar
                  </button>
                </div>
              )}

              {/* Resumo Social Discreto */}
              <div className={`pt-1 flex items-center gap-3 text-[13.5px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                {post.reactionsSummary && post.reactionsSummary.length > 0 && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                      isDark
                        ? 'bg-white/[0.04] border-white/[0.08]'
                        : 'bg-black/[0.04] border-black/[0.06]'
                    }`}
                  >
                    <span className="flex items-center text-[14px]">
                      {post.reactionsSummary.map((r) => (
                        <span key={r.type} className="-mr-1 last:mr-0 drop-shadow-xs">{r.emoji}</span>
                      ))}
                    </span>
                    <span className="font-semibold ml-1">
                      {post.reactionsSummary.reduce((acc, curr) => acc + curr.count, 0) + (post.userReaction ? 1 : 0)}
                    </span>
                  </div>
                )}

                <span>·</span>

                <button
                  type="button"
                  onClick={() => setActiveCommentsPostId(post.id)}
                  className={`hover:underline font-medium transition-colors ${
                    isDark ? 'hover:text-[#A390E4]' : 'hover:text-[#7C65C1]'
                  }`}
                >
                  {post.responsesCount} respostas
                </button>

                <span>·</span>

                <span>{post.savedCount} salvamentos</span>
              </div>

              {/* Barra de Ações Nativas Apple iOS */}
              <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {/* 1. Botão Reagir com Popover Flutuante */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveReactionPopoverPostId(isReactionPopoverOpen ? null : post.id)}
                      className={`h-9 px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-2 transition-all active:scale-95 border ${
                        userReactionObj
                          ? `${userReactionObj.activeText} ${userReactionObj.activeBg} border-transparent`
                          : isDark
                          ? 'bg-[#2C2C2E] border-transparent text-[#E5E5EA] hover:bg-[#3A3A3C]'
                          : 'bg-[#F2F2F7] border-transparent text-[#1C1C1E] hover:bg-[#E5E5EA]'
                      }`}
                    >
                      {userReactionObj ? (
                        <>
                          <AnimatedReaction type={userReactionObj.id} size={19} />
                          <span>{userReactionObj.label}</span>
                        </>
                      ) : (
                        <>
                          <Heart size={16} />
                          <span>Reagir</span>
                        </>
                      )}
                    </button>

                    {/* Popover Flutuante com Animações Lottie em Círculos */}
                    {isReactionPopoverOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setActiveReactionPopoverPostId(null)}
                        />
                        <div
                          className={`absolute bottom-full left-0 mb-3 z-40 flex items-center gap-2 rounded-full p-2 sm:p-2.5 shadow-2xl backdrop-blur-2xl border transition-all animate-pop-in ${
                            isDark
                              ? 'bg-[#1C1C1E]/95 border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.85)]'
                              : 'bg-white/95 border-black/10 shadow-[0_12px_40px_rgba(124,101,193,0.18)]'
                          }`}
                        >
                          {REACTION_OPTIONS.map((opt, index) => {
                            const isSelected = post.userReaction === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectReaction(post.id, opt.id)}
                                style={{ animationDelay: `${index * 40}ms` }}
                                className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-130 hover:-translate-y-2.5 active:scale-90 animate-pop-in ${
                                  isSelected
                                    ? isDark
                                      ? 'bg-white/20 ring-2 ring-[#A390E4] shadow-md scale-110'
                                      : 'bg-black/10 ring-2 ring-[#7C65C1] shadow-md scale-110'
                                    : isDark
                                    ? 'hover:bg-white/10 bg-white/5'
                                    : 'hover:bg-black/5 bg-black/[0.04]'
                                }`}
                                title={opt.label}
                                aria-label={opt.label}
                              >
                                {/* Tooltip Flutuante com Nome da Reação */}
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white bg-black/85 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                                  {opt.label}
                                </span>

                                {/* Micro-animação Lottie em Vetor */}
                                <AnimatedReaction type={opt.id} size={28} />
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 2. Botão Comentar */}
                  <button
                    type="button"
                    onClick={() => setActiveCommentsPostId(post.id)}
                    className={`h-9 px-3.5 rounded-full text-[14px] font-semibold flex items-center gap-2 transition-all active:scale-95 ${
                      isDark
                        ? 'bg-[#2C2C2E] text-[#E5E5EA] hover:bg-[#3A3A3C]'
                        : 'bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]'
                    }`}
                  >
                    <MessageSquare size={16} />
                    <span>Comentar</span>
                    {post.comments.length > 0 && (
                      <span className="font-bold">({post.comments.length})</span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* 3. Botão Compartilhar com Nota */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteNotePost(post);
                      setQuoteText('');
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      isDark
                        ? 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white hover:bg-[#3A3A3C]'
                        : 'bg-[#F2F2F7] text-[#636366] hover:text-black hover:bg-[#E5E5EA]'
                    }`}
                    title="Compartilhar com nota pessoal"
                  >
                    <Share2 size={16} />
                  </button>

                  {/* 4. Botão Salvar no Caderno */}
                  <button
                    type="button"
                    onClick={() => onSavePost(post.id)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      post.savedByMe
                        ? isDark
                          ? 'bg-[#A390E4]/20 text-[#D2C7F5]'
                          : 'bg-[#7C65C1]/15 text-[#5E47A3]'
                        : isDark
                        ? 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white hover:bg-[#3A3A3C]'
                        : 'bg-[#F2F2F7] text-[#636366] hover:text-black hover:bg-[#E5E5EA]'
                    }`}
                    title={post.savedByMe ? 'Salvo no seu caderno' : 'Salvar no caderno'}
                  >
                    <Bookmark
                      size={16}
                      fill={post.savedByMe ? (isDark ? '#A390E4' : '#7C65C1') : 'none'}
                    />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* 5. Apple iOS Bottom Sheet Modal de Comentários */}
      {activeCommentsPost && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:pt-12 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => {
              setActiveCommentsPostId(null);
              setReplyingToAuthor(null);
            }}
          />

          <div
            className={`relative w-full sm:max-w-xl h-[84vh] sm:h-[80vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 z-10 border ${
              isDark
                ? 'bg-[#1C1C1E] border-white/10'
                : 'bg-[#F2F2F7] border-black/10'
            }`}
          >
            {/* Grabber Handle Nativo Apple */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className={`w-10 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
            </div>

            {/* Header */}
            <div
              className={`px-6 py-3.5 border-b flex items-center justify-between shrink-0 ${
                isDark ? 'border-white/[0.08]' : 'border-black/[0.06]'
              }`}
            >
              <div>
                <h3 className={`text-[17px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                  Comentários & Debate
                </h3>
                <p className={`text-[13px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                  {activeCommentsPost.comments.length}{' '}
                  {activeCommentsPost.comments.length === 1 ? 'contribuição aprofundada' : 'contribuições aprofundadas'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveCommentsPostId(null);
                  setReplyingToAuthor(null);
                }}
                className={`p-2 rounded-full transition-colors ${
                  isDark
                    ? 'text-[#8E8E93] hover:text-white hover:bg-white/[0.08]'
                    : 'text-[#636366] hover:text-black hover:bg-black/[0.06]'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Lista de Comentários */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
              {activeCommentsPost.comments.length === 0 ? (
                <div className="py-20 text-center space-y-2.5">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border ${
                      isDark
                        ? 'bg-white/[0.04] border-white/[0.08] text-[#8E8E93]'
                        : 'bg-black/[0.04] border-black/[0.06] text-[#636366]'
                    }`}
                  >
                    <MessageSquare size={22} />
                  </div>
                  <p className={`text-[16px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                    Nenhum comentário ainda
                  </p>
                  <p className={`text-[13.5px] max-w-xs mx-auto ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                    Seja a primeira pessoa a agregar uma visão técnica ou reflexão construtiva a este debate.
                  </p>
                </div>
              ) : (
                activeCommentsPost.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className={`rounded-[20px] p-4.5 space-y-2 border ${
                      isDark
                        ? 'bg-[#2C2C2E] border-white/[0.06]'
                        : 'bg-white border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={comm.author.avatar}
                          alt={comm.author.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className={`text-[14.5px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                          {comm.author.name}
                        </span>
                        {comm.authorRole && <Badge type={comm.authorRole} />}
                      </div>
                      <span className={`text-[12px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                        {comm.createdAt}
                      </span>
                    </div>

                    <p className={`leading-relaxed text-[15px] ${isDark ? 'text-[#E5E5EA]' : 'text-[#1C1C1E]'}`}>
                      {comm.content}
                    </p>

                    <button
                      type="button"
                      onClick={() => setReplyingToAuthor(comm.author.name)}
                      className={`text-[12.5px] font-semibold transition-colors pt-1 block ${
                        isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'
                      }`}
                    >
                      Responder
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé Fixo */}
            <div
              className={`p-4 border-t shrink-0 space-y-2.5 ${
                isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
              }`}
            >
              {replyingToAuthor && (
                <div
                  className={`flex items-center justify-between text-[13px] px-3.5 py-1.5 rounded-[12px] border ${
                    isDark
                      ? 'bg-[#A390E4]/15 text-[#D2C7F5] border-[#A390E4]/30'
                      : 'bg-[#7C65C1]/12 text-[#5E47A3] border-[#7C65C1]/25'
                  }`}
                >
                  <span>Respondendo a <strong>@{replyingToAuthor}</strong></span>
                  <button onClick={() => setReplyingToAuthor(null)}>
                    <X size={15} />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 mb-1"
                />

                <textarea
                  rows={2}
                  value={modalCommentText}
                  onChange={(e) => setModalCommentText(e.target.value)}
                  placeholder="Escreva sua reflexão com clareza..."
                  className={`flex-1 rounded-[16px] p-3 text-[14px] focus:outline-none resize-none leading-relaxed border transition-colors ${
                    isDark
                      ? 'bg-[#2C2C2E] border-white/[0.08] focus:border-[#A390E4] text-white placeholder-[#8E8E93]'
                      : 'bg-[#F2F2F7] border-black/[0.06] focus:border-[#7C65C1] text-black placeholder-[#8E8E93]'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => handleSendModalComment(activeCommentsPost.id)}
                  disabled={!modalCommentText.trim()}
                  className={`px-4 py-3 rounded-[16px] text-[14px] font-semibold text-white flex items-center gap-1.5 transition-all shrink-0 mb-1 shadow-sm active:scale-95 ${
                    isDark
                      ? 'bg-[#A390E4] hover:bg-[#9887C4] disabled:opacity-40'
                      : 'bg-[#7C65C1] hover:bg-[#6C55B1] disabled:opacity-40'
                  }`}
                >
                  <Send size={15} />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Compartilhar com Nota Pessoal */}
      {quoteNotePost && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-[max(env(safe-area-inset-top),20px)] sm:pt-14 overflow-y-auto bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`border rounded-[28px] w-full max-w-lg p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#1C1C1E] border-white/10'
                : 'bg-white border-black/10'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-white/[0.08]' : 'border-black/[0.06]'
              }`}
            >
              <h3 className={`text-[17px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Compartilhar com Nota Pessoal
              </h3>
              <button
                onClick={() => setQuoteNotePost(null)}
                className={isDark ? 'text-[#8E8E93] hover:text-white' : 'text-[#636366] hover:text-black'}
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              rows={3}
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Adicione sua perspectiva e contexto antes de referenciar esta postagem..."
              className={`w-full rounded-[16px] p-3.5 text-[14px] focus:outline-none resize-none leading-relaxed border ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] focus:border-[#A390E4] text-white placeholder-[#8E8E93]'
                  : 'bg-[#F2F2F7] border-black/[0.06] focus:border-[#7C65C1] text-black placeholder-[#8E8E93]'
              }`}
            />

            <div
              className={`p-4 rounded-[16px] border text-[13.5px] space-y-1.5 ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.06]'
                  : 'bg-[#F2F2F7] border-black/[0.04]'
              }`}
            >
              <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {quoteNotePost.author.name}
              </span>
              <p className={`line-clamp-2 ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                {quoteNotePost.content}
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setQuoteNotePost(null)}
                className={`px-4 py-2 text-[14px] font-medium transition-colors ${
                  isDark ? 'text-[#8E8E93] hover:text-white' : 'text-[#636366] hover:text-black'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setQuoteNotePost(null);
                  setQuoteText('');
                }}
                className={`px-5 py-2.5 text-white rounded-[14px] text-[14px] font-semibold transition-all shadow-sm active:scale-95 ${
                  isDark ? 'bg-[#A390E4] hover:bg-[#9887C4]' : 'bg-[#7C65C1] hover:bg-[#6C55B1]'
                }`}
              >
                Publicar com Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
