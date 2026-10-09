import React, { useState } from 'react';
import { AppNotification } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Heart,
  MessageSquare,
  UserPlus,
  Compass,
  Award,
  Check,
  CheckCheck,
  ShieldCheck,
  Flame,
  Lightbulb,
  Sparkles,
  Volume2,
  BellOff,
  UserCheck,
} from 'lucide-react';

interface NotificacoesViewProps {
  notifications: AppNotification[];
  onOpenTestimonialReview: (testimonialId: string) => void;
  onAcceptConnection: (notifId: string) => void;
  onIgnoreConnection?: (notifId: string) => void;
  onMarkAllAsRead?: () => void;
  onToggleRead?: (notifId: string) => void;
  onNavigateToFeed?: () => void;
}

type FilterCategory = 'todas' | 'nao_lidas' | 'reacoes' | 'conexoes' | 'depoimentos' | 'comunidades';

export const NotificacoesView: React.FC<NotificacoesViewProps> = ({
  notifications,
  onOpenTestimonialReview,
  onAcceptConnection,
  onIgnoreConnection,
  onMarkAllAsRead,
  onToggleRead,
  onNavigateToFeed,
}) => {
  const { isDark } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('todas');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filtros inteligentes inspirados no LinkedIn
  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === 'nao_lidas') return !n.isRead;
    if (selectedFilter === 'reacoes') return n.type === 'reaction' || n.type === 'comment' || n.type === 'reply';
    if (selectedFilter === 'conexoes') return n.type === 'connection_request';
    if (selectedFilter === 'depoimentos') return n.type === 'testimonial';
    if (selectedFilter === 'comunidades') return n.type === 'new_topic' || n.type === 'tracked_topic_reply' || n.type === 'mention';
    return true;
  });

  // Agrupamento temporal inspirado no Instagram (Hoje, Esta semana, Anteriores)
  const timeGroups: { title: string; items: AppNotification[] }[] = [
    {
      title: 'Hoje',
      items: filteredNotifications.filter((n) => n.timeGroup === 'hoje'),
    },
    {
      title: 'Esta semana',
      items: filteredNotifications.filter((n) => n.timeGroup === 'esta_semana'),
    },
    {
      title: 'Anteriores',
      items: filteredNotifications.filter((n) => n.timeGroup === 'anteriores' || (!n.timeGroup && n.timeGroup !== 'hoje' && n.timeGroup !== 'esta_semana')),
    },
  ].filter((group) => group.items.length > 0);

  // Helper para renderizar micro-badge sobreposto ao avatar do autor
  const renderMicroBadge = (notif: AppNotification) => {
    switch (notif.type) {
      case 'reaction':
        if (notif.reactionType === 'heart') {
          return (
            <div className="bg-[#FF2D55] text-white p-1 rounded-full shadow-sm ring-2 ring-white dark:ring-[#1C1C1E]">
              <Heart size={10} fill="currentColor" />
            </div>
          );
        }
        if (notif.reactionType === 'fire') {
          return (
            <div className="bg-[#FF9500] text-white p-1 rounded-full shadow-sm ring-2 ring-white dark:ring-[#1C1C1E]">
              <Flame size={10} fill="currentColor" />
            </div>
          );
        }
        if (notif.reactionType === 'insightful') {
          return (
            <div className="bg-[#FFCC00] text-amber-950 p-1 rounded-full shadow-sm ring-2 ring-white dark:ring-[#1C1C1E]">
              <Lightbulb size={10} fill="currentColor" />
            </div>
          );
        }
        return (
          <div className="bg-[#7C65C1] text-white p-1 rounded-full shadow-sm ring-2 ring-white dark:ring-[#1C1C1E]">
            <Sparkles size={10} />
          </div>
        );

      case 'comment':
      case 'reply':
        return (
          <div className="bg-[#7C65C1] text-white p-1 rounded-full shadow-sm ring-2 ring-white dark:ring-[#1C1C1E]">
            <MessageSquare size={10} fill="currentColor" />
          </div>
        );

      case 'connection_request':
        return (
          <div className="bg-[#34C759] text-white p-1 rounded-full shadow-sm ring-2 ring-white dark:ring-[#1C1C1E]">
            <UserPlus size={10} />
          </div>
        );

      case 'testimonial':
        return (
          <div className="bg-[#D4A359] text-white p-1 rounded-full shadow-sm ring-2 ring-white dark:ring-[#1C1C1E]">
            <Award size={10} />
          </div>
        );

      case 'new_topic':
      case 'tracked_topic_reply':
      case 'mention':
      default:
        return (
          <div className="bg-[#5856D6] text-white p-1 rounded-full shadow-sm ring-2 ring-white dark:ring-[#1C1C1E]">
            <Compass size={10} />
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-36 pt-2 sm:pt-3 space-y-5 animate-view-enter">
      {/* 1. Header Nativo Apple iOS com Large Title & Ação Rápida */}
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#7C65C1] dark:text-[#A390E4] block">
              Sinal vs. Ruído
            </span>
            <h1
              className={`text-[32px] sm:text-[36px] font-bold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              Notificações
            </h1>
          </div>

          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className={`mb-1 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm border ${
                isDark
                  ? 'bg-[#1C1C1E] hover:bg-[#2C2C2E] border-white/[0.08] text-[#A390E4]'
                  : 'bg-white hover:bg-neutral-50 border-black/[0.06] text-[#7C65C1]'
              }`}
              title="Marcar todas como lidas"
            >
              <CheckCheck size={14} />
              <span>Marcar lidas</span>
            </button>
          )}
        </div>

        {/* 2. Filtros em Pílulas Minimalistas (LinkedIn / iOS Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-[13px] font-medium">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'nao_lidas', label: 'Não lidas', badge: unreadCount > 0 ? unreadCount : undefined },
            { id: 'reacoes', label: 'Reações & Respostas' },
            { id: 'conexoes', label: 'Conexões' },
            { id: 'depoimentos', label: 'Depoimentos' },
            { id: 'comunidades', label: 'Comunidades' },
          ].map((pill) => {
            const isActive = selectedFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedFilter(pill.id as FilterCategory)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
                  isActive
                    ? isDark
                      ? 'bg-[#A390E4] text-[#121214] font-semibold shadow-sm'
                      : 'bg-[#7C65C1] text-white font-semibold shadow-sm'
                    : isDark
                    ? 'bg-[#1C1C1E] text-[#8E8E93] hover:text-[#D1D1D6] hover:bg-[#2C2C2E] border border-white/[0.05]'
                    : 'bg-white text-[#636366] hover:text-black hover:bg-neutral-50 border border-black/[0.05]'
                }`}
              >
                <span>{pill.label}</span>
                {pill.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? isDark
                          ? 'bg-black/20 text-[#121214]'
                          : 'bg-white/25 text-white'
                        : isDark
                        ? 'bg-[#A390E4]/20 text-[#A390E4]'
                        : 'bg-[#7C65C1]/15 text-[#7C65C1]'
                    }`}
                  >
                    {pill.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* 3. Banner Sutil Anti-Distração Apple Inset Style */}
      <div
        className={`rounded-[20px] px-4 py-2.5 flex items-center justify-between gap-3 text-[13px] border transition-colors ${
          isDark
            ? 'bg-[#1C1C1E]/60 border-white/[0.06] text-[#8E8E93]'
            : 'bg-white/80 border-black/[0.04] text-[#636366] shadow-[0_2px_10px_rgba(0,0,0,0.015)]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck
            size={16}
            className={isDark ? 'text-[#30D158] shrink-0' : 'text-[#34C759] shrink-0'}
          />
          <span className="leading-tight">
            <strong className={isDark ? 'text-white' : 'text-black'}>Foco Genuíno:</strong> zero avisos algorítmicos de clique ou métricas de vaidade.
          </span>
        </div>
        <span className="text-[11px] font-medium text-[#7C65C1] dark:text-[#A390E4] shrink-0 hidden sm:inline">
          Slow Social Shield
        </span>
      </div>

      {/* 4. Lista Inset Grouped Dividida Cronologicamente (Instagram & LinkedIn UX) */}
      {timeGroups.length === 0 ? (
        <div
          className={`rounded-[26px] p-12 text-center space-y-3 border transition-colors ${
            isDark ? 'bg-[#1C1C1E] border-white/[0.06]' : 'bg-white border-black/[0.04]'
          }`}
        >
          <div
            className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
              isDark ? 'bg-white/[0.05] text-[#8E8E93]' : 'bg-black/[0.03] text-[#636366]'
            }`}
          >
            <BellOff size={26} strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <h3 className={`text-[16px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              Tudo calmo por aqui
            </h3>
            <p className={`text-[13.5px] max-w-sm mx-auto ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
              Nenhuma notificação nesta categoria. Aproveite o momento sem interrupções desnecessárias.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {timeGroups.map((group) => (
            <section key={group.title} className="space-y-2">
              {/* Cabeçalho de Seção Apple HIG */}
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8E8E93] px-2">
                {group.title}
              </h2>

              {/* Inset Grouped Container com Divisores Finos */}
              <div
                className={`rounded-[24px] border overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.02)] divide-y transition-colors ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/[0.06] divide-white/[0.05]'
                    : 'bg-white border-black/[0.04] divide-black/[0.04]'
                }`}
              >
                {group.items.map((notif) => {
                  const isAccepted = notif.connectionStatus === 'accepted';
                  const isIgnored = notif.connectionStatus === 'ignored';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => onToggleRead && onToggleRead(notif.id)}
                      className={`p-3.5 sm:p-4 flex items-center gap-3 sm:gap-3.5 transition-colors cursor-pointer group ${
                        !notif.isRead
                          ? isDark
                            ? 'bg-white/[0.02] hover:bg-white/[0.04]'
                            : 'bg-[#7C65C1]/[0.025] hover:bg-[#7C65C1]/[0.04]'
                          : isDark
                          ? 'hover:bg-white/[0.02]'
                          : 'hover:bg-black/[0.015]'
                      }`}
                    >
                      {/* Ponto indicador de não lida (Apple Lilac Dot) */}
                      <div className="w-2 flex justify-center shrink-0">
                        {!notif.isRead ? (
                          <span className="w-2 h-2 rounded-full bg-[#7C65C1] dark:bg-[#A390E4] shadow-sm animate-pulse" />
                        ) : (
                          <span className="w-2 h-2" />
                        )}
                      </div>

                      {/* Avatar do Autor com Micro-Badge Sobreposto (Estilo Instagram) */}
                      <div className="relative shrink-0">
                        <img
                          src={notif.actor.avatar}
                          alt={notif.actor.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                        />
                        <div className="absolute -bottom-1 -right-1">
                          {renderMicroBadge(notif)}
                        </div>
                      </div>

                      {/* Texto Principal Fluido (Estilo Instagram + LinkedIn) */}
                      <div className="flex-1 min-w-0 pr-1 text-[14px] leading-snug">
                        <div className="text-stone-900 dark:text-stone-100">
                          <span className="font-semibold text-black dark:text-white mr-1 hover:underline">
                            {notif.actor.name}
                          </span>
                          <span className={`${isDark ? 'text-[#D1D1D6]' : 'text-[#3A3A3C]'}`}>
                            {notif.detail}
                          </span>
                          <span className={`text-[12px] ml-1.5 whitespace-nowrap ${
                            isDark ? 'text-[#8E8E93]' : 'text-[#8E8E93]'
                          }`}>
                            {notif.timestamp}
                          </span>
                        </div>

                        {/* Detalhes contextuais extras */}
                        {notif.type === 'testimonial' && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#D4A359] dark:text-[#E5B56A] bg-[#D4A359]/10 px-2 py-0.5 rounded-full">
                              <Award size={11} /> Token Mensal de Escassez
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Elemento de Contexto / Ação Direta à Direita */}
                      <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* A: Prévia de Mídia do Post (Estilo Instagram Square Thumbnail) */}
                        {notif.postPreview && (
                          <div
                            onClick={onNavigateToFeed}
                            className="group/thumb relative cursor-pointer"
                            title="Ver postagem no feed"
                          >
                            {notif.postPreview.imageUrl ? (
                              <img
                                src={notif.postPreview.imageUrl}
                                alt="Prévia da publicação"
                                className="w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] object-cover ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-transform duration-200 group-hover/thumb:scale-105"
                              />
                            ) : notif.postPreview.mediaType === 'audio' ? (
                              <div
                                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] flex items-center justify-center border transition-all group-hover/thumb:scale-105 ${
                                  isDark
                                    ? 'bg-[#A390E4]/15 border-[#A390E4]/30 text-[#A390E4]'
                                    : 'bg-[#7C65C1]/10 border-[#7C65C1]/20 text-[#7C65C1]'
                                }`}
                              >
                                <Volume2 size={20} />
                              </div>
                            ) : (
                              <div
                                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] p-1.5 flex items-center justify-center text-[10px] leading-tight line-clamp-3 text-center border overflow-hidden ${
                                  isDark
                                    ? 'bg-white/[0.04] border-white/[0.08] text-[#8E8E93]'
                                    : 'bg-black/[0.03] border-black/[0.06] text-[#636366]'
                                }`}
                              >
                                {notif.postPreview.textSnippet?.slice(0, 30)}...
                              </div>
                            )}
                          </div>
                        )}

                        {/* B: Pílula de Ação de Conexão (Estilo LinkedIn) */}
                        {notif.type === 'connection_request' && (
                          <div className="flex items-center gap-1.5">
                            {isAccepted ? (
                              <span
                                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1 ${
                                  isDark
                                    ? 'bg-white/[0.06] text-[#8E8E93]'
                                    : 'bg-black/[0.04] text-[#636366]'
                                }`}
                              >
                                <UserCheck size={13} className="text-[#34C759]" /> Conectado
                              </span>
                            ) : isIgnored ? (
                              <span className="text-[12px] text-[#8E8E93] px-2 py-1">Ignorado</span>
                            ) : (
                              <>
                                <button
                                  onClick={() => onAcceptConnection(notif.id)}
                                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold flex items-center gap-1 transition-all shadow-sm active:scale-95 ${
                                    isDark
                                      ? 'bg-[#A390E4] hover:bg-[#9887C4] text-[#121214]'
                                      : 'bg-[#7C65C1] hover:bg-[#6C55B1] text-white'
                                  }`}
                                >
                                  <UserPlus size={13} />
                                  <span>Conectar</span>
                                </button>
                                {onIgnoreConnection && (
                                  <button
                                    onClick={() => onIgnoreConnection(notif.id)}
                                    className={`px-2 py-1.5 text-[12px] rounded-full transition-colors ${
                                      isDark
                                        ? 'text-[#8E8E93] hover:text-white'
                                        : 'text-[#8E8E93] hover:text-black'
                                    }`}
                                    title="Dispensar solicitação"
                                  >
                                    Ignorar
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* C: Pílula de Ação para Depoimento Solene */}
                        {notif.type === 'testimonial' && notif.testimonialId && (
                          <button
                            onClick={() => onOpenTestimonialReview(notif.testimonialId!)}
                            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                              isDark
                                ? 'bg-[#D4A359] hover:bg-[#C2934A] text-[#121214]'
                                : 'bg-[#D4A359] hover:bg-[#B8883E] text-white'
                            }`}
                          >
                            <Check size={13} strokeWidth={2.5} />
                            <span>Revisar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
