import React, { useState } from 'react';
import { Conversation, ChatMessage, User } from '../types';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useTheme } from '../context/ThemeContext';
import {
  Send,
  Paperclip,
  Check,
  Archive,
  Ban,
  ArrowLeft,
  Volume2,
  ShieldAlert,
} from 'lucide-react';

interface MensagensViewProps {
  conversations: Conversation[];
  onBack: () => void;
  onAcceptRequest: (convId: string) => void;
  onArchiveRequest: (convId: string) => void;
  onSendMessage: (convId: string, content: string) => void;
}

export const MensagensView: React.FC<MensagensViewProps> = ({
  conversations,
  onBack,
  onAcceptRequest,
  onArchiveRequest,
  onSendMessage,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'diretas' | 'solicitacoes'>('diretas');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  const filteredConvs = conversations.filter((c) => c.tab === activeTab);
  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  const handleSend = () => {
    if (!chatInput.trim() || !selectedConvId) return;
    onSendMessage(selectedConvId, chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-36 pt-3 sm:pt-4 space-y-6">
      {!selectedConv ? (
        <div className="space-y-5">
          {/* 1. Header Apple iOS */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#7C65C1] dark:text-[#A390E4] block">
                Comunicação Direta Assíncrona
              </span>
              <h1 className={`text-[32px] sm:text-[36px] font-bold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                Mensagens
              </h1>
            </div>
            <button
              onClick={onBack}
              className={`px-4 py-2 rounded-full text-[13.5px] font-semibold transition-all active:scale-95 border ${
                isDark
                  ? 'bg-[#1C1C1E] border-white/[0.08] text-[#8E8E93] hover:text-white'
                  : 'bg-white border-black/[0.06] text-[#636366] hover:text-black shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
              }`}
            >
              Voltar ao Feed
            </button>
          </div>

          <SegmentedControl
            options={[
              { id: 'diretas', label: 'Diretas (1º grau)' },
              {
                id: 'solicitacoes',
                label: 'Solicitações de Contato',
                badge: conversations.filter((c) => c.tab === 'solicitacoes').length,
              },
            ]}
            selected={activeTab}
            onChange={(t) => setActiveTab(t)}
          />

          <div className={`text-[12.5px] flex items-center justify-between px-1 ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
            <span>Comunicação assíncrona respeitosa</span>
            <span>Sem indicador de "online" ou cobrança</span>
          </div>

          <div key={activeTab} className="space-y-3.5 animate-view-enter">
            {filteredConvs.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`rounded-[24px] p-5 flex items-start justify-between gap-4 cursor-pointer transition-all border active:scale-[0.99] ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/[0.08] hover:border-white/[0.14]'
                    : 'bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <img
                    src={conv.participant.avatar}
                    alt={conv.participant.name}
                    className="w-13 h-13 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[16px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        {conv.participant.name}
                      </span>
                      <span
                        className={`text-[11.5px] font-medium px-2.5 py-0.5 rounded-full border ${
                          isDark
                            ? 'text-[#8E8E93] bg-white/[0.04] border-white/[0.08]'
                            : 'text-[#636366] bg-black/[0.04] border-black/[0.08]'
                        }`}
                      >
                        {conv.participant.degree}
                      </span>
                    </div>

                    {conv.subject ? (
                      <div className="space-y-0.5">
                        <span
                          className={`text-[13px] font-bold block ${
                            isDark ? 'text-[#D2C7F5]' : 'text-[#5E47A3]'
                          }`}
                        >
                          Assunto: {conv.subject}
                        </span>
                        <p className={`text-[14px] line-clamp-1 ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                          {conv.lastMessage}
                        </p>
                      </div>
                    ) : (
                      <p className={`text-[14px] line-clamp-1 ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                </div>

                <span className={`text-[12.5px] shrink-0 ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                  {conv.lastMessageTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Tela de Conversa Apple iOS */
        <div
          className={`border rounded-[32px] overflow-hidden flex flex-col h-[82vh] shadow-2xl transition-all ${
            isDark ? 'bg-[#1C1C1E] border-white/[0.1]' : 'bg-[#F2F2F7] border-black/[0.08]'
          }`}
        >
          {/* Header da Conversa */}
          <div
            className={`p-4 sm:p-5 border-b flex items-center justify-between ${
              isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setSelectedConvId(null)}
                className={`p-2 rounded-full transition-colors ${
                  isDark
                    ? 'text-[#8E8E93] hover:text-white hover:bg-white/[0.08]'
                    : 'text-[#636366] hover:text-black hover:bg-black/[0.06]'
                }`}
              >
                <ArrowLeft size={18} />
              </button>
              <img
                src={selectedConv.participant.avatar}
                alt={selectedConv.participant.name}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
              />
              <div>
                <h3 className={`text-[15.5px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {selectedConv.participant.name}
                </h3>
                <p className={`text-[12px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                  {selectedConv.participant.headline}
                </p>
              </div>
            </div>

            <span
              className={`text-[12px] font-semibold px-3 py-1 rounded-full border ${
                isDark
                  ? 'text-[#8E8E93] bg-white/[0.04] border-white/[0.08]'
                  : 'text-[#636366] bg-black/[0.04] border-black/[0.08]'
              }`}
            >
              Assíncrono
            </span>
          </div>

          {/* Prévia de Solicitação com Assunto Obrigatório */}
          {selectedConv.status === 'pending_request' && (
            <div
              className={`p-4.5 border-b space-y-3 ${
                isDark ? 'bg-[#2C2C2E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
              }`}
            >
              <div
                className={`flex items-center gap-2 text-[13px] font-bold ${
                  isDark ? 'text-[#E5B56A]' : 'text-[#8A6224]'
                }`}
              >
                <ShieldAlert size={16} />
                <span>Solicitação de Contato com Assunto Obrigatório (140 chars):</span>
              </div>
              <p
                className={`text-[14px] p-3.5 rounded-[16px] border italic font-normal ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/[0.08] text-white'
                    : 'bg-[#F2F2F7] border-black/[0.06] text-black'
                }`}
              >
                “{selectedConv.subject}”
              </p>
              <p className={`text-[12px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                Você lê esta mensagem sem disparar confirmação de leitura para o remetente.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onAcceptRequest(selectedConv.id)}
                  className={`flex-1 py-2 text-white font-bold text-[13.5px] rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                    isDark
                      ? 'bg-[#A390E4] hover:bg-[#9887C4]'
                      : 'bg-[#7C65C1] hover:bg-[#6C55B1]'
                  }`}
                >
                  <Check size={15} /> Aceitar
                </button>
                <button
                  onClick={() => onArchiveRequest(selectedConv.id)}
                  className={`flex-1 py-2 border font-semibold text-[13.5px] rounded-full flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                    isDark
                      ? 'bg-[#1C1C1E] hover:bg-[#3A3A3C] border-white/[0.08] text-white'
                      : 'bg-[#F2F2F7] hover:bg-[#E5E5EA] border-black/[0.06] text-black'
                  }`}
                >
                  <Archive size={15} /> Arquivar
                </button>
                <button
                  onClick={() => onArchiveRequest(selectedConv.id)}
                  className="py-2 px-4 bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/25 font-bold text-[13.5px] rounded-full flex items-center justify-center gap-1 transition-colors active:scale-95"
                >
                  <Ban size={15} /> Bloquear
                </button>
              </div>
            </div>
          )}

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selectedConv.messages.map((msg) => {
              const isMe = msg.senderId === 'usr-me';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[22px] p-4.5 space-y-2 text-[15px] leading-relaxed ${
                      isMe
                        ? isDark
                          ? 'bg-[#A390E4] text-white rounded-br-[4px] shadow-sm'
                          : 'bg-[#7C65C1] text-white rounded-br-[4px] shadow-sm'
                        : isDark
                        ? 'bg-[#2C2C2E] text-white border border-white/[0.08] rounded-bl-[4px]'
                        : 'bg-white text-black border border-black/[0.04] rounded-bl-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    <p>{msg.content}</p>

                    {msg.audioNote && (
                      <div className="pt-2 border-t border-white/20 space-y-1.5">
                        <div className="flex items-center gap-2 text-[13px] font-bold">
                          <Volume2 size={15} />
                          <span>Mensagem de Áudio ({msg.audioNote.duration})</span>
                        </div>
                        <div
                          className={`p-2.5 rounded-[12px] text-[13px] italic ${
                            isMe
                              ? 'bg-black/20 text-white'
                              : isDark
                              ? 'bg-black/30 text-white'
                              : 'bg-black/[0.04] text-stone-800'
                          }`}
                        >
                          Transcrição: {msg.audioNote.transcription}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`text-[11.5px] mt-1 px-1.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                    {msg.createdAt}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input de Mensagem */}
          <div
            className={`p-4 border-t flex items-center gap-3 ${
              isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
            }`}
          >
            <button
              className={`p-2.5 rounded-full transition-colors ${
                isDark ? 'text-[#8E8E93] hover:text-white' : 'text-[#636366] hover:text-black'
              }`}
              title="Anexar arquivo"
            >
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escreva sua mensagem com clareza..."
              className={`flex-1 border rounded-[18px] px-4.5 py-3 text-[14.5px] focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] focus:border-[#A390E4] text-white placeholder-[#8E8E93]'
                  : 'bg-[#F2F2F7] border-black/[0.06] focus:border-[#7C65C1] text-black placeholder-[#8E8E93]'
              }`}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              className={`p-3 rounded-full text-white transition-all shadow-sm active:scale-95 ${
                isDark
                  ? 'bg-[#A390E4] hover:bg-[#9887C4]'
                  : 'bg-[#7C65C1] hover:bg-[#6C55B1]'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
