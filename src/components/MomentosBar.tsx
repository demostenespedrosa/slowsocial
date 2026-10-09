import React, { useState } from 'react';
import { Momento, User } from '../types';
import { Plus, X, Clock, Eye } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MomentosBarProps {
  currentUser: User;
  momentos: Momento[];
  onAddMomento: () => void;
}

export const MomentosBar: React.FC<MomentosBarProps> = ({
  currentUser,
  momentos,
  onAddMomento,
}) => {
  const { isDark } = useTheme();
  const [activeMomento, setActiveMomento] = useState<Momento | null>(null);
  const [localMomentos, setLocalMomentos] = useState<Momento[]>(momentos);

  const handleOpenMomento = (momento: Momento) => {
    setActiveMomento(momento);
    setLocalMomentos((prev) =>
      prev.map((m) => (m.id === momento.id ? { ...m, hasViewed: true } : m))
    );
  };

  return (
    <>
      {/* Trilho Horizontal de Momentos Estilo Apple iOS */}
      <div
        className={`mb-6 rounded-[22px] p-3.5 sm:p-4 border transition-all ${
          isDark
            ? 'bg-[#1C1C1E] border-white/[0.08]'
            : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-0.5">
          {/* 1. Adicionar o Seu Próprio Momento */}
          <div
            onClick={onAddMomento}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-full p-0.5 border-2 transition-all ${
                  isDark
                    ? 'border-white/10 group-hover:border-[#A390E4]'
                    : 'border-black/10 group-hover:border-[#7C65C1]'
                }`}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full text-white flex items-center justify-center ring-2 shadow-sm ${
                  isDark
                    ? 'bg-[#A390E4] ring-[#1C1C1E]'
                    : 'bg-[#7C65C1] ring-white'
                }`}
              >
                <Plus size={14} strokeWidth={2.6} />
              </div>
            </div>
            <span
              className={`text-[13px] font-medium transition-colors ${
                isDark
                  ? 'text-[#8E8E93] group-hover:text-white'
                  : 'text-[#636366] group-hover:text-black'
              }`}
            >
              Você
            </span>
          </div>

          {/* 2. Lista de Momentos dos Contatos Conectados */}
          {localMomentos.map((m) => (
            <div
              key={m.id}
              onClick={() => handleOpenMomento(m)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="relative">
                <div
                  className={`w-16 h-16 p-[2.5px] rounded-full transition-all duration-200 ${
                    !m.hasViewed
                      ? 'bg-gradient-to-tr from-[#7C65C1] via-[#A390E4] to-[#34C759]'
                      : isDark
                      ? 'bg-white/10'
                      : 'bg-black/10'
                  }`}
                >
                  <img
                    src={m.author.avatar}
                    alt={m.author.name}
                    className={`w-full h-full rounded-full object-cover ring-2 ${
                      isDark ? 'ring-[#1C1C1E]' : 'ring-white'
                    }`}
                  />
                </div>
              </div>
              <span
                className={`text-[13px] font-medium max-w-[68px] truncate text-center transition-colors ${
                  isDark
                    ? 'text-white/90 group-hover:text-white'
                    : 'text-stone-900 group-hover:text-black'
                }`}
              >
                {m.author.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Visualizador Vertical de Momentos (Modal 24h Apple Style) */}
      {activeMomento && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-xl p-2 sm:p-4 pt-[max(env(safe-area-inset-top),12px)] sm:pt-8 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm h-[88vh] max-h-[740px] bg-[#000000] border border-white/[0.12] rounded-[32px] overflow-hidden flex flex-col justify-between shadow-2xl animate-pop-in">
            {/* Barra de Progresso Efêmero (24h) */}
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
              <div className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-full animate-[progress_5s_linear]" />
              </div>
            </div>

            {/* Header do Momento */}
            <div className="p-4 pt-7 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeMomento.author.avatar}
                  alt={activeMomento.author.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                />
                <div>
                  <h3 className="text-[14px] font-semibold text-white leading-tight">
                    {activeMomento.author.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/70">
                    <span>{activeMomento.createdAt}</span>
                    <span>·</span>
                    <span className="text-[#D2C7F5] flex items-center gap-1 font-medium">
                      <Clock size={11} /> Expira em {activeMomento.expiresInHours}h
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveMomento(null)}
                className="p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mídia / Conteúdo Vertical do Momento */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
              {activeMomento.mediaUrl ? (
                <img
                  src={activeMomento.mediaUrl}
                  alt="Momento"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xl text-white font-medium leading-relaxed">
                    “{activeMomento.textNote}”
                  </p>
                </div>
              )}
            </div>

            {/* Legenda / Nota na Base */}
            <div className="p-5 z-20 bg-gradient-to-t from-black via-black/85 to-transparent space-y-2.5">
              {activeMomento.textNote && activeMomento.mediaUrl && (
                <p className="text-[14px] text-white font-medium leading-relaxed drop-shadow-sm">
                  {activeMomento.textNote}
                </p>
              )}
              <div className="flex items-center justify-between text-[12px] text-white/60 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1.5">
                  <Eye size={13} /> Visível apenas para conexões
                </span>
                <span className="text-white/80 font-medium">Desaparece em 24h</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
