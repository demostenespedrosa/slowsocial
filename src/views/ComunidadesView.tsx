import React, { useState } from 'react';
import { Community, CommunityTopic, Comment } from '../types';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../context/ThemeContext';
import {
  Compass,
  Plus,
  MessageSquare,
  ChevronRight,
  X,
  Send,
  Users,
} from 'lucide-react';

interface ComunidadesViewProps {
  communities: Community[];
  onOpenCreateCommunity: () => void;
  onExploreCommunities: () => void;
}

export const ComunidadesView: React.FC<ComunidadesViewProps> = ({
  communities,
  onOpenCreateCommunity,
  onExploreCommunities,
}) => {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'feed' | 'diretorio'>('feed');
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [expandedCommunities, setExpandedCommunities] = useState<Record<string, boolean>>({});

  const toggleExpand = (communityId: string) => {
    setExpandedCommunities((prev) => ({
      ...prev,
      [communityId]: !prev[communityId],
    }));
  };

  const handleAddThreadReply = () => {
    if (!replyInput.trim() || !selectedTopic) return;
    const newComment: Comment = {
      id: `comm-reply-${Date.now()}`,
      author: {
        id: 'usr-me',
        name: 'Demóstenes',
        pronouns: 'ele/dele',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        headline: 'Arquiteto de Sistemas',
        location: 'São Paulo',
        degree: '1º grau',
        memberSince: '2024',
        mutualConnectionsCount: 48,
        about: '',
        verifiedLinks: [],
        projects: [],
        communitiesCount: 6,
        testimonialTokensRemaining: 1,
      },
      authorRole: 'Membro Ativo',
      content: replyInput.trim(),
      createdAt: 'Agora mesmo',
    };
    selectedTopic.comments.push(newComment);
    selectedTopic.responsesCount += 1;
    setReplyInput('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-36 pt-3 sm:pt-4 space-y-6">
      {/* 1. Header Apple iOS com Large Title */}
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#7C65C1] dark:text-[#A390E4] block">
              Fóruns & Hubs Temáticos
            </span>
            <h1 className={`text-[32px] sm:text-[36px] font-bold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              Comunidades
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExploreCommunities}
              className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 border ${
                isDark
                  ? 'bg-[#1C1C1E] border-white/[0.08] text-[#8E8E93] hover:text-white'
                  : 'bg-white border-black/[0.06] text-[#636366] hover:text-black shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
              }`}
            >
              <Compass size={16} /> Explorar
            </button>
            <button
              onClick={onOpenCreateCommunity}
              className={`px-4 py-2 rounded-full text-[13.5px] font-bold flex items-center gap-1.5 text-white shadow-sm transition-all active:scale-95 ${
                isDark
                  ? 'bg-[#A390E4] hover:bg-[#9887C4]'
                  : 'bg-[#7C65C1] hover:bg-[#6C55B1]'
              }`}
            >
              <Plus size={16} strokeWidth={2.6} /> Criar
            </button>
          </div>
        </div>

        {/* 2. Seletor de Modo Apple Segmented Control */}
        <SegmentedControl
          options={[
            { id: 'feed', label: 'Feed de Tópicos (Fair-Share)' },
            { id: 'diretorio', label: 'Diretório por Categorias' },
          ]}
          selected={viewMode}
          onChange={(m) => setViewMode(m)}
        />
      </header>

      {/* 3. Trilho Superior: Comunidades Fixadas */}
      <div
        className={`rounded-[22px] p-4 border transition-all ${
          isDark
            ? 'bg-[#1C1C1E] border-white/[0.08]'
            : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
        }`}
      >
        <span className={`text-[12px] font-bold uppercase tracking-wider block mb-3 px-1 ${
          isDark ? 'text-[#8E8E93]' : 'text-[#636366]'
        }`}>
          Comunidades Fixadas
        </span>
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-1">
          {communities.map((comm) => (
            <div
              key={comm.id}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group active:scale-95 transition-transform"
            >
              <div
                className={`relative w-15 h-15 rounded-[18px] flex items-center justify-center text-2xl transition-all duration-200 border ${
                  isDark
                    ? 'bg-[#2C2C2E] border-white/[0.08] group-hover:border-[#A390E4]'
                    : 'bg-[#F2F2F7] border-black/[0.06] group-hover:border-[#7C65C1]'
                }`}
              >
                {comm.icon}
                {comm.unreadTopicsCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center ring-2 ${
                      isDark ? 'bg-[#A390E4] ring-[#1C1C1E]' : 'bg-[#7C65C1] ring-white'
                    }`}
                  >
                    {comm.unreadTopicsCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[12.5px] font-semibold max-w-[70px] truncate text-center ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              >
                {comm.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Modo: Feed de Tópicos com Fair-Share */}
      {viewMode === 'feed' && (
        <div className="space-y-6 animate-view-enter">
          {communities.map((comm) => {
            const isExpanded = !!expandedCommunities[comm.id];
            const visibleTopics = isExpanded ? comm.topics : comm.topics.slice(0, 2);
            const hiddenCount = comm.topics.length - 2;

            if (comm.topics.length === 0) return null;

            return (
              <section key={comm.id} className="space-y-3.5">
                {/* Cabeçalho da Comunidade */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{comm.icon}</span>
                    <h2 className={`text-[17px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                      {comm.name}
                    </h2>
                    <span
                      className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full border ${
                        isDark
                          ? 'text-[#8E8E93] bg-white/[0.04] border-white/[0.08]'
                          : 'text-[#636366] bg-black/[0.04] border-black/[0.08]'
                      }`}
                    >
                      {comm.category}
                    </span>
                  </div>
                  <span className={`text-[13px] font-medium flex items-center gap-1 ${
                    isDark ? 'text-[#8E8E93]' : 'text-[#636366]'
                  }`}>
                    <Users size={14} /> {comm.membersCount}
                  </span>
                </div>

                {/* Tópicos da Comunidade (Inset Grouped) */}
                <div className="space-y-3.5">
                  {visibleTopics.map((topic) => (
                    <article
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`rounded-[24px] p-5 sm:p-6 cursor-pointer transition-all space-y-3 group border active:scale-[0.99] ${
                        isDark
                          ? 'bg-[#1C1C1E] border-white/[0.08] hover:border-white/[0.14]'
                          : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={topic.author.avatar}
                            alt={topic.author.name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
                          />
                          <span className={`text-[14.5px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                            {topic.author.name}
                          </span>
                          <Badge type={topic.authorRole} />
                        </div>
                        <span className={`text-[13px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                          {topic.lastActive}
                        </span>
                      </div>

                      <h3
                        className={`text-[18px] sm:text-[19px] font-bold tracking-tight transition-colors ${
                          isDark
                            ? 'text-white group-hover:text-[#D2C7F5]'
                            : 'text-black group-hover:text-[#5E47A3]'
                        }`}
                      >
                        {topic.title}
                      </h3>

                      <p
                        className={`text-[15px] sm:text-[16px] line-clamp-2 leading-relaxed ${
                          isDark ? 'text-[#E5E5EA]' : 'text-stone-700'
                        }`}
                      >
                        {topic.content}
                      </p>

                      <div className={`flex items-center justify-between pt-1 text-[13.5px] ${
                        isDark ? 'text-[#8E8E93]' : 'text-[#636366]'
                      }`}>
                        <span className={`flex items-center gap-1.5 font-semibold ${
                          isDark ? 'text-white' : 'text-black'
                        }`}>
                          <MessageSquare size={15} className={isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'} /> {topic.responsesCount} respostas
                        </span>
                        <span
                          className={`font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${
                            isDark ? 'text-[#D2C7F5]' : 'text-[#5E47A3]'
                          }`}
                        >
                          Ver debate <ChevronRight size={15} />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Colapso Fair-Share */}
                {hiddenCount > 0 && !isExpanded && (
                  <button
                    onClick={() => toggleExpand(comm.id)}
                    className={`w-full py-3 rounded-[18px] flex items-center justify-center gap-2 text-[14px] font-semibold transition-all border active:scale-98 ${
                      isDark
                        ? 'bg-[#1C1C1E] border-white/[0.08] hover:border-white/[0.14] text-[#D2C7F5]'
                        : 'bg-white border-black/[0.06] hover:border-black/[0.12] text-[#5E47A3] shadow-xs'
                    }`}
                  >
                    <span>+{hiddenCount} novos debates em {comm.name}</span>
                    <ChevronRight size={15} className="rotate-90" />
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* 5. Modo: Diretório */}
      {viewMode === 'diretorio' && (
        <div className="space-y-3 animate-view-enter">
          <div
            className={`rounded-[26px] p-5 border divide-y ${
              isDark
                ? 'bg-[#1C1C1E] border-white/[0.08] divide-white/[0.06]'
                : 'bg-white border-black/[0.04] divide-black/[0.05] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            {communities.map((comm) => (
              <div key={comm.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <span
                    className={`text-2xl p-3 rounded-[18px] border ${
                      isDark ? 'bg-[#2C2C2E] border-white/[0.06]' : 'bg-[#F2F2F7] border-black/[0.04]'
                    }`}
                  >
                    {comm.icon}
                  </span>
                  <div>
                    <h3 className={`text-[16px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      {comm.name}
                    </h3>
                    <p className={`text-[13.5px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                      {comm.category} · {comm.membersCount} participantes
                    </p>
                  </div>
                </div>
                <button
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
                    isDark
                      ? 'bg-white/[0.08] hover:bg-white/[0.14] text-white'
                      : 'bg-[#F2F2F7] hover:bg-[#E5E5EA] text-black'
                  }`}
                >
                  Acessar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Modal / Visão de Tópico Estilo Fórum Encadeado */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`border rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl ${
              isDark ? 'bg-[#1C1C1E] border-white/10' : 'bg-[#F2F2F7] border-black/10'
            }`}
          >
            {/* Top Bar */}
            <div
              className={`p-5 border-b flex items-center justify-between ${
                isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[13px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>Tópico em</span>
                <span
                  className={`text-[13px] font-bold px-3 py-1 rounded-full border ${
                    isDark
                      ? 'text-white bg-white/[0.08] border-white/[0.1]'
                      : 'text-black bg-[#E5E5EA] border-black/[0.08]'
                  }`}
                >
                  {selectedTopic.communityName}
                </span>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className={`p-2 rounded-full transition-colors ${
                  isDark
                    ? 'text-[#8E8E93] hover:text-white hover:bg-white/[0.08]'
                    : 'text-[#636366] hover:text-black hover:bg-black/[0.06]'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedTopic.author.avatar}
                  alt={selectedTopic.author.name}
                  className="w-11 h-11 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[16px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      {selectedTopic.author.name}
                    </span>
                    <Badge type={selectedTopic.authorRole} />
                  </div>
                  <span className={`text-[13px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                    {selectedTopic.lastActive}
                  </span>
                </div>
              </div>

              <h2 className={`text-[22px] font-bold tracking-tight leading-snug ${isDark ? 'text-white' : 'text-black'}`}>
                {selectedTopic.title}
              </h2>
              <div className={`text-[16px] leading-relaxed whitespace-pre-line ${isDark ? 'text-[#E5E5EA]' : 'text-stone-800'}`}>
                {selectedTopic.content}
              </div>

              {/* Fórum Encadeado */}
              <div
                className={`pt-5 border-t space-y-3.5 ${
                  isDark ? 'border-white/[0.08]' : 'border-black/[0.06]'
                }`}
              >
                <h3 className={`text-[13px] font-bold uppercase tracking-wider ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                  Discussão Encadeada ({selectedTopic.responsesCount} contribuições)
                </h3>

                {selectedTopic.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className={`rounded-[20px] p-4.5 space-y-2 border ${
                      isDark
                        ? 'bg-[#2C2C2E] border-white/[0.06]'
                        : 'bg-white border-black/[0.04] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img src={comm.author.avatar} alt={comm.author.name} className="w-7 h-7 rounded-full object-cover" />
                        <span className={`font-bold text-[14.5px] ${isDark ? 'text-white' : 'text-black'}`}>
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

                    {/* Respostas Aninhadas */}
                    {comm.replies && comm.replies.length > 0 && (
                      <div
                        className={`pl-4 border-l-2 mt-3 space-y-2 ${
                          isDark ? 'border-[#A390E4]/40' : 'border-[#7C65C1]/40'
                        }`}
                      >
                        {comm.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className={`p-3.5 rounded-[16px] border space-y-1 ${
                              isDark
                                ? 'bg-[#1C1C1E] border-white/[0.04]'
                                : 'bg-[#F2F2F7] border-black/[0.04]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-[13.5px] ${isDark ? 'text-white' : 'text-black'}`}>
                                {reply.author.name}
                              </span>
                              {reply.authorRole && <Badge type={reply.authorRole} />}
                              <span className={`text-[11px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                                · {reply.createdAt}
                              </span>
                            </div>
                            <p className={`text-[14px] leading-relaxed ${isDark ? 'text-[#E5E5EA]' : 'text-stone-800'}`}>
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Input de Resposta */}
            <div
              className={`p-4 border-t flex items-center gap-3 ${
                isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
              }`}
            >
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Escreva sua contribuição para a roda..."
                className={`flex-1 border rounded-[16px] px-4 py-3 text-[14px] focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#2C2C2E] border-white/[0.08] focus:border-[#A390E4] text-white placeholder-[#8E8E93]'
                    : 'bg-[#F2F2F7] border-black/[0.06] focus:border-[#7C65C1] text-black placeholder-[#8E8E93]'
                }`}
                onKeyDown={(e) => e.key === 'Enter' && handleAddThreadReply()}
              />
              <button
                onClick={handleAddThreadReply}
                className={`px-5 py-3 text-white rounded-[16px] text-[14px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  isDark
                    ? 'bg-[#A390E4] hover:bg-[#9887C4]'
                    : 'bg-[#7C65C1] hover:bg-[#6C55B1]'
                }`}
              >
                <Send size={15} /> Responder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
