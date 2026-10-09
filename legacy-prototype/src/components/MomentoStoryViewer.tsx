import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Momento, User } from '../types';
import { X, Clock, ChevronLeft, ChevronRight, Send, Pause, Play, Sparkles } from 'lucide-react';
import { AnimatedReaction, ReactionType } from './ui/AnimatedReaction';

interface AuthorStoryGroup {
  author: User;
  stories: Momento[];
}

interface ReactionParticle {
  id: string;
  reactionType: ReactionType;
  emoji: string;
  leftPercent: number;
  delayMs: number;
}

interface MomentoStoryViewerProps {
  initialAuthorId: string;
  momentos: Momento[];
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
  onSendReply?: (author: User, message: string) => void;
}

const STORY_DURATION_MS = 5000;
const TICK_INTERVAL_MS = 25;

const REACTION_ITEMS: { id: ReactionType; emoji: string; label: string }[] = [
  { id: 'heart', emoji: '❤️', label: 'Curtir' },
  { id: 'fire', emoji: '🔥', label: 'Fogo' },
  { id: 'clap', emoji: '👏', label: 'Palmas' },
  { id: 'lightbulb', emoji: '💡', label: 'Genial' },
  { id: 'handshake', emoji: '🤝', label: 'Apoio' },
  { id: 'thinking', emoji: '🤔', label: 'Pensativo' },
];

export const MomentoStoryViewer: React.FC<MomentoStoryViewerProps> = ({
  initialAuthorId,
  momentos,
  onClose,
  onStoryViewed,
  onSendReply,
}) => {
  // 1. Agrupar Momentos por Autor
  const authorGroups = useMemo<AuthorStoryGroup[]>(() => {
    const map = new Map<string, { author: User; stories: Momento[] }>();
    momentos.forEach((m) => {
      const existing = map.get(m.author.id);
      if (existing) {
        existing.stories.push(m);
      } else {
        map.set(m.author.id, { author: m.author, stories: [m] });
      }
    });
    return Array.from(map.values());
  }, [momentos]);

  // Encontrar o índice inicial do autor
  const initialGroupIdx = useMemo(() => {
    const idx = authorGroups.findIndex((g) => g.author.id === initialAuthorId);
    return idx >= 0 ? idx : 0;
  }, [authorGroups, initialAuthorId]);

  // Encontrar o primeiro story não visto desse autor (ou 0 se todos vistos)
  const initialStoryIdx = useMemo(() => {
    const group = authorGroups[initialGroupIdx];
    if (!group) return 0;
    const unviewedIdx = group.stories.findIndex((s) => !s.hasViewed);
    return unviewedIdx >= 0 ? unviewedIdx : 0;
  }, [authorGroups, initialGroupIdx]);

  const [currentGroupIdx, setCurrentGroupIdx] = useState(initialGroupIdx);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(initialStoryIdx);
  const [progress, setProgress] = useState(0);

  // Estados de Pausa e Interação
  const [isHolding, setIsHolding] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  // Mensagem e Reações
  const [replyText, setReplyText] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [particles, setParticles] = useState<ReactionParticle[]>([]);
  const [showReactionStrip, setShowReactionStrip] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const holdStartRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const isPaused = isHolding || isInputFocused || isManuallyPaused;

  const currentGroup = authorGroups[currentGroupIdx] || authorGroups[0];
  const currentStory = currentGroup?.stories[currentStoryIdx] || currentGroup?.stories[0];

  // Marcar como visto sempre que mudar de story
  useEffect(() => {
    if (currentStory) {
      onStoryViewed?.(currentStory.id);
    }
  }, [currentStory?.id, onStoryViewed]);

  // Avançar para próximo story / pessoa (Lógica exata do Instagram)
  const handleNext = useCallback(() => {
    if (!currentGroup) {
      onClose();
      return;
    }

    if (currentStoryIdx + 1 < currentGroup.stories.length) {
      // Próximo story da MESMA pessoa
      setCurrentStoryIdx((prev) => prev + 1);
      setProgress(0);
    } else {
      // Acabaram os stories dessa pessoa -> passar para a PRÓXIMA pessoa
      if (currentGroupIdx + 1 < authorGroups.length) {
        setCurrentGroupIdx((prev) => prev + 1);
        setCurrentStoryIdx(0);
        setProgress(0);
      } else {
        // Acabaram todos os stories de todas as pessoas
        onClose();
      }
    }
  }, [currentGroup, currentStoryIdx, currentGroupIdx, authorGroups.length, onClose]);

  // Voltar para story anterior / pessoa anterior (Lógica exata do Instagram)
  const handlePrev = useCallback(() => {
    // Se já passou mais de 25% do tempo do story atual, reinicia ele primeiro
    if (progress > 25) {
      setProgress(0);
      return;
    }

    if (currentStoryIdx > 0) {
      // Story anterior da MESMA pessoa
      setCurrentStoryIdx((prev) => prev - 1);
      setProgress(0);
    } else {
      // Primeiro story dessa pessoa -> voltar para o ÚLTIMO story da pessoa ANTERIOR
      if (currentGroupIdx > 0) {
        const prevGroup = authorGroups[currentGroupIdx - 1];
        setCurrentGroupIdx((prev) => prev - 1);
        setCurrentStoryIdx(Math.max(0, prevGroup.stories.length - 1));
        setProgress(0);
      } else {
        // Já está no início de tudo
        setProgress(0);
      }
    }
  }, [progress, currentStoryIdx, currentGroupIdx, authorGroups]);

  // Timer de progresso da barra (Instagram 5s)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const step = (TICK_INTERVAL_MS / STORY_DURATION_MS) * 100;
        const next = prev + step;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPaused, handleNext]);

  // Teclado (Desktop accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsManuallyPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputFocused, onClose, handleNext, handlePrev]);

  // Gestos de toque / clique (Segurar para pausar + Toque rápido para navegar)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Não interferir se clicar em botões ou inputs
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
      return;
    }

    holdStartRef.current = {
      time: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };
    setIsHolding(true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!holdStartRef.current) {
      setIsHolding(false);
      return;
    }

    const duration = Date.now() - holdStartRef.current.time;
    const deltaX = Math.abs(e.clientX - holdStartRef.current.x);
    const deltaY = Math.abs(e.clientY - holdStartRef.current.y);

    setIsHolding(false);

    // Se foi um toque curto (< 240ms) e sem arrastar (tap rápido)
    if (duration < 240 && deltaX < 15 && deltaY < 15 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;

      if (relativeX < 0.35) {
        handlePrev();
      } else {
        handleNext();
      }
    }

    holdStartRef.current = null;
  };

  const handlePointerCancel = () => {
    setIsHolding(false);
    holdStartRef.current = null;
  };

  // Enviar Reação Flutuante
  const handleReact = (item: { id: ReactionType; emoji: string; label: string }) => {
    // Gerar explosão de 4 a 6 partículas flutuantes
    const count = 5;
    const newParticles: ReactionParticle[] = [];

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `particle-${Date.now()}-${i}`,
        reactionType: item.id,
        emoji: item.emoji,
        leftPercent: 40 + Math.random() * 45, // Distribuído na direita/centro
        delayMs: i * 90,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    // Limpar partículas após a animação
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 2200);

    // Mostrar Toast de feedback
    const authorName = currentGroup?.author.name.split(' ')[0] || 'Autor';
    setFeedbackToast(`Você reagiu a ${authorName} com ${item.emoji}`);
    setTimeout(() => setFeedbackToast(null), 2400);
  };

  // Enviar Resposta de Texto
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentGroup) return;

    onSendReply?.(currentGroup.author, replyText.trim());
    const authorName = currentGroup.author.name.split(' ')[0];

    setFeedbackToast(`Resposta enviada para ${authorName}! ✉️`);
    setTimeout(() => setFeedbackToast(null), 2500);

    setReplyText('');
    setIsInputFocused(false);
    (document.activeElement as HTMLElement)?.blur();
  };

  if (!currentGroup || !currentStory) return null;

  const authorFirstName = currentGroup.author.name.split(' ')[0];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-0 sm:p-4 select-none animate-in fade-in duration-200">
      {/* Botão Anterior Desktop (fora da moldura) */}
      <button
        onClick={handlePrev}
        className="hidden md:flex items-center justify-center absolute left-8 lg:left-16 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 shadow-lg border border-white/10 z-50 group"
        title="Story anterior (Seta Esquerda)"
      >
        <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Moldura Central Estilo Instagram Stories */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        className="relative w-full h-[100dvh] sm:h-[92vh] sm:max-h-[840px] sm:max-w-[420px] bg-black sm:rounded-[36px] overflow-hidden flex flex-col justify-between shadow-[0_25px_60px_rgba(0,0,0,0.9)] sm:border sm:border-white/15 animate-pop-in"
      >
        {/* =========================================================================
            1. BARRAS DE PROGRESSO SEGMENTADAS (Uma por story do autor atual)
            ========================================================================= */}
        <div
          className={`absolute top-0 left-0 right-0 z-30 pt-3 sm:pt-3.5 px-3 flex gap-1.5 transition-opacity duration-200 ${
            isHolding ? 'opacity-25' : 'opacity-100'
          }`}
        >
          {currentGroup.stories.map((story, idx) => {
            let widthPercent = 0;
            if (idx < currentStoryIdx) {
              widthPercent = 100;
            } else if (idx === currentStoryIdx) {
              widthPercent = progress;
            } else {
              widthPercent = 0;
            }

            return (
              <div
                key={story.id}
                className="h-[3px] sm:h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-md"
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-75"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* =========================================================================
            2. CABEÇALHO DO STORY (Autor, Foto, Tempo, Expiração, Fechar)
            ========================================================================= */}
        <div
          className={`relative z-30 pt-7 sm:pt-8 px-3.5 pb-4 flex items-center justify-between bg-gradient-to-b from-black/85 via-black/45 to-transparent transition-opacity duration-200 ${
            isHolding ? 'opacity-20' : 'opacity-100'
          }`}
        >
          {/* Informações do Autor */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={currentGroup.author.avatar}
                alt={currentGroup.author.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#A390E4] shadow-md"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-white leading-tight drop-shadow-md">
                  {currentGroup.author.name}
                </h3>
                <span className="text-[11.5px] font-normal text-white/70">
                  {currentStory.createdAt}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                <span className="text-[#D2C7F5] flex items-center gap-1 font-medium bg-black/40 px-1.5 py-0.5 rounded-full border border-white/10">
                  <Clock size={10} /> Expira em {currentStory.expiresInHours}h
                </span>
                {currentGroup.stories.length > 1 && (
                  <span className="text-white/60 text-[10px]">
                    · {currentStoryIdx + 1} de {currentGroup.stories.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controles do Cabeçalho */}
          <div className="flex items-center gap-1.5">
            {/* Indicador de Pausa */}
            {isPaused && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 border border-white/15 text-white/90 text-[11px] font-medium backdrop-blur-md animate-pulse">
                <Pause size={10} fill="currentColor" />
                <span>Pausado</span>
              </div>
            )}

            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition-all active:scale-90"
              title="Fechar (Esc)"
            >
              <X size={18} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* =========================================================================
            3. CONTEÚDO VISUAL DO STORY (Foto em tela cheia OU Cartão de Texto Filosófico)
            ========================================================================= */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-[#0A0A0C]">
          {currentStory.mediaUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={currentStory.mediaUrl}
                alt={currentStory.textNote || 'Momento'}
                className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-700 ease-out"
              />

              {/* Vinheta suave para leitura limpa das legendas */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

              {/* Legenda Flutuante em Pílula Acrílica se houver texto */}
              {currentStory.textNote && (
                <div
                  className={`absolute bottom-5 left-4 right-4 z-20 transition-opacity duration-200 ${
                    isHolding ? 'opacity-20' : 'opacity-100'
                  }`}
                >
                  <div className="p-3.5 sm:p-4 rounded-[20px] bg-black/60 backdrop-blur-xl border border-white/15 text-white shadow-xl">
                    <p className="text-[14px] sm:text-[14.5px] font-medium leading-relaxed drop-shadow-sm">
                      {currentStory.textNote}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Story Exclusivo de Texto / Pensamento (Gradiente Sofisticado Lilás/Dark)
            <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-[#2D1B4E] via-[#1A162B] to-[#0D0B14]">
              {/* Círculo decorativo de iluminação de fundo */}
              <div className="absolute w-72 h-72 rounded-full bg-[#7C65C1]/20 blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-xs space-y-4">
                <span className="inline-flex p-2.5 rounded-2xl bg-white/10 text-[#D2C7F5] border border-white/10 shadow-inner">
                  <Sparkles size={20} />
                </span>
                <p className="text-xl sm:text-2xl font-serif italic text-white/95 leading-relaxed drop-shadow-md">
                  {currentStory.textNote}
                </p>
                <div className="h-0.5 w-12 mx-auto bg-gradient-to-r from-transparent via-[#A390E4] to-transparent" />
                <span className="text-[12px] uppercase tracking-wider font-semibold text-white/60 block">
                  {currentGroup.author.name}
                </span>
              </div>
            </div>
          )}

          {/* Guias Visuais Sutis de Toque (Esquerda / Direita) */}
          <div className="absolute inset-y-0 left-0 w-[30%] pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-[70%] pointer-events-none" />

          {/* Chuva de Partículas de Reação Flutuantes (Instagram Reaction Stream) */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bottom-20 z-40 pointer-events-none animate-float-reaction select-none"
              style={{
                left: `${p.leftPercent}%`,
                animationDelay: `${p.delayMs}ms`,
              }}
            >
              <div className="p-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 shadow-xl transform hover:scale-125">
                <AnimatedReaction type={p.reactionType} size={38} />
              </div>
            </div>
          ))}

          {/* Feedback Toast (Ex: "Você reagiu com ❤️") */}
          {feedbackToast && (
            <div className="absolute top-20 z-50 px-4 py-2 rounded-full bg-black/85 text-white text-[12.5px] font-semibold border border-white/20 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200">
              {feedbackToast}
            </div>
          )}
        </div>

        {/* =========================================================================
            4. BARRA INFERIOR: RESPOSTA DIRETA & REAÇÕES (Instagram Style)
            ========================================================================= */}
        <div
          className={`relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black via-black/95 to-transparent space-y-2.5 transition-opacity duration-200 ${
            isHolding ? 'opacity-20 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Seletor Rápido de Reações Estilo Instagram Posts */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11.5px] font-medium text-white/70">
              Reações rápidas:
            </span>
            <button
              type="button"
              onClick={() => setShowReactionStrip((prev) => !prev)}
              className="text-[11.5px] text-[#D2C7F5] font-semibold hover:underline"
            >
              {showReactionStrip ? 'Ocultar' : 'Ver todas (6)'}
            </button>
          </div>

          {/* Pílulas de Reações com Lottie / SVG Animados */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {(showReactionStrip ? REACTION_ITEMS : REACTION_ITEMS.slice(0, 5)).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleReact(item)}
                className="group relative flex-1 h-10 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center border border-white/15 backdrop-blur-md shadow-sm"
                title={`Reagir com ${item.label}`}
              >
                <div className="group-hover:scale-125 group-active:scale-95 transition-transform">
                  <AnimatedReaction type={item.id} size={24} />
                </div>
              </button>
            ))}
          </div>

          {/* Campo de Resposta Direta (DM / Comentário para o autor) */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={`Responder a ${authorFirstName}...`}
                className="w-full h-11 pl-4 pr-11 rounded-full bg-white/12 border border-white/20 text-white placeholder-white/60 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#A390E4] focus:bg-white/18 backdrop-blur-md transition-all"
              />
              {replyText.trim() && (
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C65C1] to-[#A390E4] text-white flex items-center justify-center transition-all active:scale-90 shadow-md"
                  title="Enviar mensagem"
                >
                  <Send size={14} className="translate-x-[-1px] translate-y-[-1px]" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Botão Próximo Desktop (fora da moldura) */}
      <button
        onClick={handleNext}
        className="hidden md:flex items-center justify-center absolute right-8 lg:right-16 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 shadow-lg border border-white/10 z-50 group"
        title="Próximo story (Seta Direita)"
      >
        <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>,
    document.body
  );
};
