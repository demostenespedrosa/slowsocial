import React, { useState } from 'react';
import { User, Testimonial, Post, Community } from '../types';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../context/ThemeContext';
import {
  MapPin,
  Calendar,
  Users,
  MessageSquare,
  Award,
  ExternalLink,
  CheckCircle,
  Clock,
  Sparkles,
  Send,
  X,
  Sun,
  Moon,
  Smartphone,
  Download,
} from 'lucide-react';

interface PerfilViewProps {
  user: User;
  testimonials: Testimonial[];
  userPosts: Post[];
  communities: Community[];
  onOpenMessageWithUser: (user: User) => void;
  onApproveTestimonial: (testId: string) => void;
  onSubmitNewTestimonial: (content: string) => void;
}

export const PerfilView: React.FC<PerfilViewProps> = ({
  user,
  testimonials,
  userPosts,
  communities,
  onOpenMessageWithUser,
  onApproveTestimonial,
  onSubmitNewTestimonial,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [profileTab, setProfileTab] = useState<'sobre' | 'depoimentos' | 'comunidades' | 'discussoes'>('sobre');
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [testimonialText, setTestimonialText] = useState('');

  const approvedTestimonials = testimonials.filter((t) => t.status === 'approved');
  const pendingTestimonials = testimonials.filter((t) => t.status === 'pending');

  const handleSendTestimonial = () => {
    if (!testimonialText.trim()) return;
    onSubmitNewTestimonial(testimonialText.trim());
    setTestimonialText('');
    setIsTestimonialModalOpen(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-36 pt-3 sm:pt-4 space-y-6">
      {/* 1. Masthead de Identidade Estilo Apple Inset Grouped */}
      <div
        className={`rounded-[28px] p-6 sm:p-7 space-y-5 border transition-all ${
          isDark
            ? 'bg-[#1C1C1E] border-white/[0.08] shadow-sm'
            : 'bg-white border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex items-start gap-5">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-22 h-22 rounded-[22px] object-cover ring-2 ring-black/[0.06] dark:ring-white/[0.1] shrink-0"
          />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className={`text-[24px] sm:text-[27px] font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                {user.name}
              </h1>
              <span className={`text-[14px] font-medium ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                ({user.pronouns})
              </span>
              <Badge type={user.degree} />
            </div>

            <p className={`text-[15px] sm:text-[16px] leading-relaxed font-normal ${isDark ? 'text-[#E5E5EA]' : 'text-stone-700'}`}>
              {user.headline}
            </p>

            <div className={`flex items-center gap-3 text-[13.5px] flex-wrap pt-0.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className={isDark ? 'text-[#8E8E93]' : 'text-[#636366]'} /> {user.location}
              </span>
              {user.degreeVia && (
                <span className={isDark ? 'text-[#D2C7F5]' : 'text-[#5E47A3]'}>via {user.degreeVia}</span>
              )}
            </div>
          </div>
        </div>

        {/* Métricas Autênticas (Sem contagem de seguidores!) */}
        <div
          className={`pt-4 border-t flex items-center justify-between text-[13.5px] ${
            isDark ? 'border-white/[0.08] text-[#8E8E93]' : 'border-black/[0.06] text-[#636366]'
          }`}
        >
          <span className={`flex items-center gap-2 font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            <Users size={16} className={isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'} /> {user.mutualConnectionsCount} Conexões Mútuas
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={15} /> Membro desde {user.memberSince}
          </span>
        </div>

        {/* Painel de Ações com Padrão Apple Touch Target */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            className={`py-2.5 px-3 rounded-full text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
              isDark
                ? 'bg-[#2C2C2E] border-white/[0.08] text-white hover:bg-[#3A3A3C]'
                : 'bg-[#F2F2F7] border-black/[0.04] text-black hover:bg-[#E5E5EA]'
            }`}
          >
            Conectado (1º)
          </button>
          <button
            onClick={() => onOpenMessageWithUser(user)}
            className={`py-2.5 px-3 rounded-full text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
              isDark
                ? 'bg-[#2C2C2E] border-white/[0.08] text-white hover:bg-[#3A3A3C]'
                : 'bg-[#F2F2F7] border-black/[0.04] text-black hover:bg-[#E5E5EA]'
            }`}
          >
            <MessageSquare size={16} /> Mensagem
          </button>
          <button
            onClick={() => setIsTestimonialModalOpen(true)}
            className={`py-2.5 px-3 rounded-full text-[13.5px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm text-white active:scale-95 ${
              isDark
                ? 'bg-[#A390E4] hover:bg-[#9887C4]'
                : 'bg-[#7C65C1] hover:bg-[#6C55B1]'
            }`}
          >
            <Award size={16} /> Recomendar
          </button>
        </div>
      </div>

      {/* 2. Interruptor de Tema (Aparência Apple iOS) */}
      <div
        className={`p-4.5 rounded-[24px] border flex items-center justify-between gap-4 transition-all ${
          isDark
            ? 'bg-[#1C1C1E] border-white/[0.08]'
            : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded-[16px] ${
              isDark ? 'bg-[#A390E4]/15 text-[#D2C7F5]' : 'bg-[#7C65C1]/12 text-[#5E47A3]'
            }`}
          >
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
          </div>
          <div>
            <h3 className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Tema da Interface
            </h3>
            <p className={`text-[13px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
              {isDark ? 'Modo Escuro Apple OLED ativado' : 'Modo Claro Apple Grouped (Padrão) ativado'}
            </p>
          </div>
        </div>

        {/* Interruptor Switch iOS Autêntico */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
            isDark ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
          }`}
          title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out flex items-center justify-center ${
              isDark ? 'translate-x-6 text-[#34C759]' : 'translate-x-0 text-stone-500'
            }`}
          >
            {isDark ? <Moon size={13} /> : <Sun size={13} />}
          </span>
        </button>
      </div>

      {/* 2.1 Informações do Aplicativo PWA */}
      <div
        className={`p-4 rounded-[22px] border flex items-center justify-between gap-3 transition-all ${
          isDark
            ? 'bg-[#1C1C1E] border-white/[0.08]'
            : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src="/icons/apple-touch-icon.png"
            alt="Slow Social Icon"
            className="w-10 h-10 rounded-[11px] shadow-sm ring-1 ring-black/5 shrink-0 object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-[14.5px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Slow Social Web App (PWA)
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[#34C759]">
                Vercel Ready
              </span>
            </div>
            <p className={`text-[12.5px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
              Instalável no iOS & Android • Suporte Offline Ativo
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <span
            className={`text-[12px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              isDark
                ? 'bg-white/[0.06] text-[#A390E4]'
                : 'bg-[#7C65C1]/10 text-[#7C65C1]'
            }`}
          >
            <Smartphone size={14} /> Standalone
          </span>
        </div>
      </div>

      {/* 3. Navegação por Abas do Perfil */}
      <div>
        <SegmentedControl
          options={[
            { id: 'sobre', label: 'Sobre & Projetos' },
            { id: 'depoimentos', label: 'Depoimentos', badge: approvedTestimonials.length },
            { id: 'comunidades', label: 'Comunidades' },
            { id: 'discussoes', label: 'Discussões' },
          ]}
          selected={profileTab}
          onChange={(tab) => setProfileTab(tab)}
        />
      </div>

      {/* 4. Conteúdo das Abas */}

      {/* ABA: SOBRE & PROJETOS */}
      {profileTab === 'sobre' && (
        <div className="space-y-5 animate-view-enter">
          {/* Biografia */}
          <div
            className={`border rounded-[26px] p-6 space-y-2.5 transition-all ${
              isDark
                ? 'bg-[#1C1C1E] border-white/[0.08]'
                : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <h2 className={`text-[12px] font-bold uppercase tracking-wider ${
              isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'
            }`}>
              Trajetória & Interesses
            </h2>
            <p className={`text-[15.5px] leading-relaxed font-normal ${isDark ? 'text-[#E5E5EA]' : 'text-stone-800'}`}>
              {user.about}
            </p>
          </div>

          {/* Links Verificados */}
          <div
            className={`border rounded-[26px] p-6 space-y-3.5 transition-all ${
              isDark
                ? 'bg-[#1C1C1E] border-white/[0.08]'
                : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <h2 className={`text-[12px] font-bold uppercase tracking-wider ${
              isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'
            }`}>
              Links Verificados
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {user.verifiedLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-4 py-2.5 border text-[13.5px] font-semibold rounded-[14px] flex items-center gap-2 transition-all active:scale-95 ${
                    isDark
                      ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] border-white/[0.08] text-white'
                      : 'bg-[#F2F2F7] hover:bg-[#E5E5EA] border-black/[0.06] text-black'
                  }`}
                >
                  <span>{link.label}</span>
                  <ExternalLink size={14} className={isDark ? 'text-[#8E8E93]' : 'text-[#636366]'} />
                </a>
              ))}
            </div>
          </div>

          {/* Projetos Autorais */}
          <div className="space-y-3.5">
            <h2 className={`text-[12px] font-bold uppercase tracking-wider px-1 ${
              isDark ? 'text-[#8E8E93]' : 'text-[#636366]'
            }`}>
              Projetos Autorais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {user.projects.map((proj) => (
                <div
                  key={proj.id}
                  className={`border rounded-[26px] p-5.5 space-y-3 flex flex-col justify-between transition-all ${
                    isDark
                      ? 'bg-[#1C1C1E] border-white/[0.08] hover:border-white/[0.14]'
                      : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  <div>
                    <h3 className={`text-[16px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      {proj.title}
                    </h3>
                    <p className={`text-[14px] mt-1.5 leading-relaxed ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                      {proj.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {proj.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className={`text-[11.5px] font-medium px-2.5 py-0.5 rounded-full border ${
                          isDark
                            ? 'text-[#8E8E93] bg-white/[0.04] border-white/[0.08]'
                            : 'text-[#636366] bg-black/[0.04] border-black/[0.08]'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA: DEPOIMENTOS (Escassez: 1 token por mês) */}
      {profileTab === 'depoimentos' && (
        <div className="space-y-5 animate-view-enter">
          {/* Card de Escassez */}
          <div
            className={`border rounded-[22px] p-4.5 flex items-center justify-between text-[14px] ${
              isDark
                ? 'bg-[#A390E4]/12 border-[#A390E4]/25 text-[#D2C7F5]'
                : 'bg-[#7C65C1]/10 border-[#7C65C1]/20 text-[#5E47A3]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="shrink-0" />
              <span>
                Depoimentos baseados em escassez: cada membro possui apenas <strong>1 token mensal</strong>.
              </span>
            </div>
            <span
              className={`font-bold whitespace-nowrap px-3 py-1 rounded-full border ${
                isDark
                  ? 'text-[#D2C7F5] bg-[#A390E4]/20 border-[#A390E4]/30'
                  : 'text-[#5E47A3] bg-[#7C65C1]/15 border-[#7C65C1]/25'
              }`}
            >
              {user.testimonialTokensRemaining}/1 disponível
            </span>
          </div>

          {/* Depoimentos Pendentes de Aprovação */}
          {pendingTestimonials.length > 0 && (
            <div
              className={`border rounded-[26px] p-6 space-y-4 ${
                isDark
                  ? 'bg-[#1C1C1E] border-[#D4A359]/35'
                  : 'bg-white border-[#D4A359]/40 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[#D4A359] flex items-center gap-2">
                  <Clock size={16} /> Depoimento aguardando sua aprovação
                </span>
                <span className={`text-[12px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>Privado</span>
              </div>

              {pendingTestimonials.map((pt) => (
                <div key={pt.id} className="space-y-3 pt-1">
                  <div className="flex items-center gap-3">
                    <img src={pt.fromUser.avatar} alt={pt.fromUser.name} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <p className={`text-[14.5px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>{pt.fromUser.name}</p>
                      <p className={`text-[12px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>{pt.createdAt}</p>
                    </div>
                  </div>
                  <p className={`text-[15px] leading-relaxed italic border-l-2 border-[#D4A359]/60 pl-4 ${isDark ? 'text-[#E5E5EA]' : 'text-stone-800'}`}>
                    “{pt.content}”
                  </p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onApproveTestimonial(pt.id)}
                      className={`px-4 py-2.5 text-white rounded-full text-[13.5px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                        isDark
                          ? 'bg-[#A390E4] hover:bg-[#9887C4]'
                          : 'bg-[#7C65C1] hover:bg-[#6C55B1]'
                      }`}
                    >
                      <CheckCircle size={15} /> Aprovar no Perfil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lista de Depoimentos Aprovados */}
          <div className="space-y-4">
            {approvedTestimonials.length === 0 ? (
              <p className={`text-[14px] py-10 text-center ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                Nenhum depoimento exibido ainda.
              </p>
            ) : (
              approvedTestimonials.map((test) => (
                <div
                  key={test.id}
                  className={`border rounded-[26px] p-6 space-y-3.5 transition-all ${
                    isDark
                      ? 'bg-[#1C1C1E] border-white/[0.08]'
                      : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <img src={test.fromUser.avatar} alt={test.fromUser.name} className="w-11 h-11 rounded-full object-cover" />
                      <div>
                        <span className={`text-[15.5px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>{test.fromUser.name}</span>
                        <p className={`text-[13px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>{test.fromUser.headline}</p>
                      </div>
                    </div>
                    <span className={`text-[13px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>{test.createdAt}</span>
                  </div>
                  <p className={`text-[16px] leading-relaxed font-serif italic pl-1 ${isDark ? 'text-[#E5E5EA]' : 'text-stone-800'}`}>
                    “{test.content}”
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA: COMUNIDADES */}
      {profileTab === 'comunidades' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-view-enter">
          {communities.map((c) => (
            <div
              key={c.id}
              className={`border rounded-[26px] p-5 flex items-center gap-3.5 transition-all ${
                isDark
                  ? 'bg-[#1C1C1E] border-white/[0.08]'
                  : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
              }`}
            >
              <div
                className={`w-13 h-13 rounded-[18px] flex items-center justify-center text-2xl shrink-0 ${
                  isDark ? 'bg-[#2C2C2E]' : 'bg-[#F2F2F7]'
                }`}
              >
                {c.icon}
              </div>
              <div className="min-w-0">
                <h3 className={`text-[15.5px] font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{c.name}</h3>
                <p className={`text-[13px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>{c.category}</p>
                <span className={`text-[12px] font-medium ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>{c.membersCount} membros</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABA: DISCUSSÕES */}
      {profileTab === 'discussoes' && (
        <div className="space-y-4 animate-view-enter">
          {userPosts.length === 0 ? (
            <p className={`text-[14px] py-10 text-center ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
              Nenhuma discussão iniciada pelo usuário ainda.
            </p>
          ) : (
            userPosts.map((p) => (
              <div
                key={p.id}
                className={`border rounded-[26px] p-6 space-y-3 transition-all ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/[0.08]'
                    : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                }`}
              >
                <div className="flex items-center justify-between text-[13px]">
                  <span className={`font-semibold ${isDark ? 'text-[#D2C7F5]' : 'text-[#5E47A3]'}`}>{p.communityName || 'Publicação Pessoal'}</span>
                  <span className={isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}>{p.createdAt}</span>
                </div>
                {p.title && <h3 className={`text-[18px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>{p.title}</h3>}
                <p className={`text-[15px] line-clamp-2 ${isDark ? 'text-[#E5E5EA]' : 'text-stone-700'}`}>{p.content}</p>
                <div className={`pt-2 flex items-center gap-4 text-[13px] font-medium ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                  <span>{p.responsesCount} respostas</span>
                  <span>{p.savedCount} salvamentos</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Escrever Depoimento */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-[max(env(safe-area-inset-top),20px)] sm:pt-14 overflow-y-auto bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`border rounded-[32px] w-full max-w-lg p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-[#1C1C1E] border-white/10'
                : 'bg-white border-black/10'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.06]'}`}>
              <h3 className={`text-[17px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Recomendar {user.name}
              </h3>
              <button
                onClick={() => setIsTestimonialModalOpen(false)}
                className={`p-2 rounded-full ${isDark ? 'text-[#8E8E93] hover:text-white' : 'text-[#636366] hover:text-black'}`}
              >
                <X size={18} />
              </button>
            </div>

            <p className={`text-[13.5px] leading-relaxed ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
              Você está prestes a utilizar seu <strong>único token de recomendação deste mês</strong>. Depoimentos são mensagens solenes e permanentes, e só serão exibidos após a aprovação do destinatário.
            </p>

            <textarea
              rows={5}
              value={testimonialText}
              onChange={(e) => setTestimonialText(e.target.value)}
              placeholder="Escreva um testemunho sincero sobre a convivência técnica, ética ou intelectual..."
              className={`w-full rounded-[18px] p-4 text-[14px] focus:outline-none leading-relaxed resize-none border ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] focus:border-[#A390E4] text-white placeholder-[#8E8E93]'
                  : 'bg-[#F2F2F7] border-black/[0.06] focus:border-[#7C65C1] text-black placeholder-[#8E8E93]'
              }`}
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsTestimonialModalOpen(false)}
                className={`px-4 py-2 text-[14px] font-medium ${isDark ? 'text-[#8E8E93] hover:text-white' : 'text-[#636366] hover:text-black'}`}
              >
                Cancelar
              </button>
              <button
                disabled={!testimonialText.trim()}
                onClick={handleSendTestimonial}
                className={`px-5 py-2.5 rounded-full text-[14px] font-bold flex items-center gap-1.5 shadow-sm text-white transition-all active:scale-95 ${
                  testimonialText.trim()
                    ? isDark
                      ? 'bg-[#A390E4] hover:bg-[#9887C4]'
                      : 'bg-[#7C65C1] hover:bg-[#6C55B1]'
                    : 'bg-stone-300 dark:bg-stone-700 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Send size={15} /> Enviar Token de Depoimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
