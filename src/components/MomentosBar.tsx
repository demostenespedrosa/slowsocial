import React, { useState, useMemo } from 'react';
import { Momento, User } from '../types';
import { Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { MomentoStoryViewer } from './MomentoStoryViewer';

interface MomentosBarProps {
  currentUser: User;
  momentos: Momento[];
  onAddMomento: () => void;
  onSendReply?: (author: User, message: string) => void;
}

interface AuthorGroupPreview {
  author: User;
  stories: Momento[];
  hasUnviewed: boolean;
}

export const MomentosBar: React.FC<MomentosBarProps> = ({
  currentUser,
  momentos,
  onAddMomento,
  onSendReply,
}) => {
  const { isDark } = useTheme();
  const [activeAuthorId, setActiveAuthorId] = useState<string | null>(null);
  const [localMomentos, setLocalMomentos] = useState<Momento[]>(momentos);

  // Manter localMomentos sincronizado caso a prop externa mude
  React.useEffect(() => {
    setLocalMomentos(momentos);
  }, [momentos]);

  // Agrupar momentos por autor para a barra horizontal do feed
  const authorGroups = useMemo<AuthorGroupPreview[]>(() => {
    const map = new Map<string, AuthorGroupPreview>();

    localMomentos.forEach((m) => {
      const existing = map.get(m.author.id);
      if (existing) {
        existing.stories.push(m);
        if (!m.hasViewed) existing.hasUnviewed = true;
      } else {
        map.set(m.author.id, {
          author: m.author,
          stories: [m],
          hasUnviewed: !m.hasViewed,
        });
      }
    });

    return Array.from(map.values());
  }, [localMomentos]);

  const handleOpenAuthorStories = (authorId: string) => {
    setActiveAuthorId(authorId);
  };

  const handleStoryViewed = (storyId: string) => {
    setLocalMomentos((prev) =>
      prev.map((m) => (m.id === storyId ? { ...m, hasViewed: true } : m))
    );
  };

  return (
    <>
      {/* Trilho Horizontal de Momentos Estilo Apple iOS & Instagram */}
      <div
        className={`mb-6 rounded-[22px] p-3.5 sm:p-4 border transition-all ${
          isDark
            ? 'bg-[#1C1C1E] border-white/[0.08]'
            : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex items-center gap-[8px] overflow-x-auto scrollbar-none py-1 px-0.5">
          {/* 1. Adicionar o Seu Próprio Momento */}
          <div
            onClick={onAddMomento}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="relative">
              <div
                className={`w-[64px] h-[64px] rounded-full flex items-center justify-center p-[2px] border-2 border-dashed transition-all ${
                  isDark
                    ? 'border-white/20 group-hover:border-[#A390E4]'
                    : 'border-black/15 group-hover:border-[#7C65C1]'
                }`}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-[56px] h-[56px] rounded-full object-cover"
                />
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full text-white flex items-center justify-center ring-2 shadow-sm transition-transform group-hover:scale-110 ${
                  isDark
                    ? 'bg-gradient-to-tr from-[#7C65C1] to-[#A390E4] ring-[#1C1C1E]'
                    : 'bg-gradient-to-tr from-[#6C55B1] to-[#7C65C1] ring-white'
                }`}
              >
                <Plus size={13} strokeWidth={2.8} />
              </div>
            </div>
            <span
              className={`text-[11.5px] font-medium transition-colors max-w-[64px] truncate text-center ${
                isDark
                  ? 'text-[#8E8E93] group-hover:text-white'
                  : 'text-[#636366] group-hover:text-black'
              }`}
            >
              Você
            </span>
          </div>

          {/* 2. Lista de Momentos dos Contatos Conectados Agrupados por Pessoa */}
          {authorGroups.map((group) => {
            const firstName = group.author.name.split(' ')[0];

            return (
              <div
                key={group.author.id}
                onClick={() => handleOpenAuthorStories(group.author.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="relative">
                  {/* Círculo Externo 64x64 dp com Destaque Instagram e Foto Interna 56x56 dp */}
                  <div
                    className={`w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all duration-300 ${
                      group.hasUnviewed
                        ? 'p-[3px] bg-gradient-to-tr from-[#6C55B1] via-[#A855F7] to-[#EC4899] shadow-[0_3px_14px_rgba(168,85,247,0.36)] group-hover:shadow-[0_4px_18px_rgba(168,85,247,0.48)] group-hover:scale-105'
                        : isDark
                        ? 'p-[1.5px] bg-white/20'
                        : 'p-[1.5px] bg-black/15'
                    }`}
                  >
                    <img
                      src={group.author.avatar}
                      alt={group.author.name}
                      className={`w-[56px] h-[56px] rounded-full object-cover ring-2 transition-all ${
                        isDark ? 'ring-[#1C1C1E]' : 'ring-white'
                      } ${!group.hasUnviewed ? 'opacity-85' : 'opacity-100'}`}
                    />
                  </div>

                  {/* Indicador de múltiplos stories se houver mais de 1 */}
                  {group.stories.length > 1 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7C65C1] dark:bg-[#A390E4] text-white text-[9.5px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1C1C1E] shadow-xs">
                      {group.stories.length}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11.5px] font-medium max-w-[64px] truncate text-center transition-colors ${
                    group.hasUnviewed
                      ? isDark
                        ? 'text-white font-semibold'
                        : 'text-black font-semibold'
                      : isDark
                      ? 'text-[#8E8E93] group-hover:text-white'
                      : 'text-[#636366] group-hover:text-black'
                  }`}
                >
                  {firstName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visualizador de Stories em Tela Cheia Estilo Instagram */}
      {activeAuthorId && (
        <MomentoStoryViewer
          initialAuthorId={activeAuthorId}
          momentos={localMomentos}
          onClose={() => setActiveAuthorId(null)}
          onStoryViewed={handleStoryViewed}
          onSendReply={onSendReply}
        />
      )}
    </>
  );
};
