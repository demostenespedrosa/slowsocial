import React, { useState, useEffect } from 'react';
import { Community, Post } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Code2,
  List,
  Quote,
  Paperclip,
  BarChart2,
  Lock,
  Globe,
  Users,
  AlertCircle,
  X,
} from 'lucide-react';

interface ComposerViewProps {
  communities: Community[];
  onClose: () => void;
  onSubmitPost: (newPost: Partial<Post>) => void;
}

export const ComposerView: React.FC<ComposerViewProps> = ({
  communities,
  onClose,
  onSubmitPost,
}) => {
  const { isDark } = useTheme();
  const [context, setContext] = useState<'profile' | string>('profile');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState<'rust' | 'sql' | 'typescript'>('typescript');
  const [codeContent, setCodeContent] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [privacy, setPrivacy] = useState<'anyone' | 'connections_only' | 'members_only'>('connections_only');

  const [attachmentType, setAttachmentType] = useState<'none' | 'file' | 'poll'>('none');
  const [attachedFileName, setAttachedFileName] = useState('');

  const isLongPost = content.length > 280;
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isHolding) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            handleFinalPublish();
            return 100;
          }
          return prev + 3.33;
        });
      }, 100);
    } else {
      setHoldProgress(0);
    }
    return () => clearInterval(interval);
  }, [isHolding]);

  const handleFinalPublish = () => {
    const targetCommunity = communities.find((c) => c.id === context);
    onSubmitPost({
      title: title.trim() || undefined,
      content: content.trim(),
      codeSnippet: showCodeInput && codeContent ? { language: codeLanguage, code: codeContent } : undefined,
      attachments: attachmentType === 'file' ? { type: 'file', fileName: attachedFileName || 'documento_tecnico.pdf', fileSize: '1.2 MB' } : undefined,
      communityName: targetCommunity ? targetCommunity.name : undefined,
      privacy,
      source: 'conexoes',
    });
    onClose();
  };

  const insertMarkdown = (syntax: 'code' | 'list' | 'quote') => {
    if (syntax === 'code') {
      setShowCodeInput(!showCodeInput);
    } else if (syntax === 'list') {
      setContent((prev) => prev + '\n- Ponto chave:\n- Desdobramento:');
    } else if (syntax === 'quote') {
      setContent((prev) => prev + '\n> "Citação que fundamenta esta reflexão"');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-[max(env(safe-area-inset-top),12px)] sm:pt-8 overflow-y-auto bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`border rounded-[32px] w-full max-w-2xl max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl ${
          isDark
            ? 'bg-[#1C1C1E] border-white/10'
            : 'bg-[#F2F2F7] border-black/10'
        }`}
      >
        {/* Header Apple iOS */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
          }`}
        >
          <div>
            <h2 className={`text-[17px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Criar Publicação Estruturada
            </h2>
            <p className={`text-[12.5px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
              Formule ideias completas e respeite o tempo de leitura da sua rede
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark
                ? 'text-[#8E8E93] hover:text-white hover:bg-white/[0.08]'
                : 'text-[#636366] hover:text-black hover:bg-black/[0.06]'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Contexto */}
          <div className="space-y-1.5">
            <label className={`text-[12px] font-bold uppercase tracking-wider ${
              isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'
            }`}>
              Onde você deseja publicar?
            </label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className={`w-full rounded-[16px] px-4 py-3 text-[14.5px] font-medium focus:outline-none border transition-colors ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] focus:border-[#A390E4] text-white'
                  : 'bg-white border-black/[0.06] focus:border-[#7C65C1] text-black'
              }`}
            >
              <option value="profile">Publicar no Meu Perfil (Visível para Conexões)</option>
              <optgroup label="Comunidades & Fóruns">
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    Publicar em {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 2. Título */}
          <div className="space-y-1.5">
            <label className={`text-[12px] font-bold uppercase tracking-wider ${
              isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'
            }`}>
              Título da Postagem (Opcional / Artigo)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Por que a comunicação assíncrona constrói autonomia..."
              className={`w-full rounded-[16px] px-4 py-3 text-[15.5px] font-semibold placeholder-[#8E8E93] focus:outline-none border transition-colors ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] focus:border-[#A390E4] text-white'
                  : 'bg-white border-black/[0.06] focus:border-[#7C65C1] text-black'
              }`}
            />
          </div>

          {/* 3. Toolbar Markdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => insertMarkdown('code')}
              className={`px-3.5 py-2 rounded-full text-[13px] font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
                showCodeInput
                  ? isDark
                    ? 'bg-[#A390E4]/20 border-[#A390E4]/40 text-[#D2C7F5]'
                    : 'bg-[#7C65C1]/15 border-[#7C65C1]/30 text-[#5E47A3]'
                  : isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] text-white hover:bg-[#3A3A3C]'
                  : 'bg-white border-black/[0.06] text-black hover:bg-[#E5E5EA]'
              }`}
            >
              <Code2 size={15} /> Bloco de Código
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('list')}
              className={`px-3.5 py-2 rounded-full text-[13px] font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] text-white hover:bg-[#3A3A3C]'
                  : 'bg-white border-black/[0.06] text-black hover:bg-[#E5E5EA]'
              }`}
            >
              <List size={15} /> Lista de Argumentos
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('quote')}
              className={`px-3.5 py-2 rounded-full text-[13px] font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] text-white hover:bg-[#3A3A3C]'
                  : 'bg-white border-black/[0.06] text-black hover:bg-[#E5E5EA]'
              }`}
            >
              <Quote size={15} /> Citação
            </button>
          </div>

          {/* Input de Snippet de Código */}
          {showCodeInput && (
            <div
              className={`p-4.5 rounded-[20px] border space-y-3 ${
                isDark ? 'bg-[#000000] border-white/[0.08]' : 'bg-white border-black/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between text-[13px]">
                <span className={`font-bold ${isDark ? 'text-[#D2C7F5]' : 'text-[#5E47A3]'}`}>Linguagem Técnica</span>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value as any)}
                  className={`border rounded-[10px] px-3 py-1 text-[13px] font-semibold focus:outline-none ${
                    isDark
                      ? 'bg-[#2C2C2E] border-white/[0.1] text-white'
                      : 'bg-[#F2F2F7] border-black/[0.1] text-black'
                  }`}
                >
                  <option value="typescript">TypeScript</option>
                  <option value="rust">Rust</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              <textarea
                rows={4}
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="// Cole ou escreva seu snippet aqui..."
                className={`w-full rounded-[14px] p-3 font-mono text-[13.5px] focus:outline-none resize-none border ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/[0.08] text-[#30D158]'
                    : 'bg-[#F2F2F7] border-black/[0.06] text-[#1E7E34]'
                }`}
              />
            </div>
          )}

          {/* 4. Área de Texto Principal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-[12px] font-bold uppercase tracking-wider ${
                isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'
              }`}>
                Desenvolvimento da Ideia (Markdown Ativo)
              </label>
              <span className={`text-[12px] font-semibold ${content.length > 500 ? (isDark ? 'text-[#D2C7F5]' : 'text-[#5E47A3]') : 'text-[#8E8E93]'}`}>
                {content.length} caracteres
              </span>
            </div>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Estruture sua reflexão com profundidade. Evite respostas monossilábicas ou apressadas..."
              className={`w-full rounded-[20px] p-4 text-[15.5px] leading-relaxed placeholder-[#8E8E93] focus:outline-none resize-none border transition-colors ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.08] focus:border-[#A390E4] text-white'
                  : 'bg-white border-black/[0.06] focus:border-[#7C65C1] text-black'
              }`}
            />
          </div>

          {/* 5. Gaveta de Anexos */}
          <div className="space-y-2">
            <span className={`text-[12px] font-bold uppercase tracking-wider ${
              isDark ? 'text-[#8E8E93]' : 'text-[#636366]'
            }`}>
              Anexos de Valor Técnico
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAttachmentType(attachmentType === 'file' ? 'none' : 'file');
                  if (!attachedFileName) setAttachedFileName('relatorio_arquitetura.pdf');
                }}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold flex items-center gap-2 border transition-all active:scale-95 ${
                  attachmentType === 'file'
                    ? isDark
                      ? 'bg-[#A390E4]/20 border-[#A390E4]/40 text-[#D2C7F5]'
                      : 'bg-[#7C65C1]/15 border-[#7C65C1]/30 text-[#5E47A3]'
                    : isDark
                    ? 'bg-[#2C2C2E] border-white/[0.08] text-white hover:bg-[#3A3A3C]'
                    : 'bg-white border-black/[0.06] text-black hover:bg-[#E5E5EA]'
                }`}
              >
                <Paperclip size={15} /> Documento / PDF
              </button>
            </div>

            {attachmentType === 'file' && (
              <div
                className={`p-3.5 rounded-[16px] border flex items-center justify-between text-[13.5px] ${
                  isDark ? 'bg-[#2C2C2E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Paperclip size={16} className={isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'} />
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{attachedFileName}</span>
                  <span className="text-[#8E8E93] text-[12px]">(1.2 MB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentType('none')}
                  className="text-[#8E8E93] hover:text-[#FF453A]"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* 6. Controle de Privacidade */}
          <div className="space-y-1.5 pt-1">
            <label className={`text-[12px] font-bold uppercase tracking-wider ${
              isDark ? 'text-[#8E8E93]' : 'text-[#636366]'
            }`}>
              Quem pode responder a esta publicação?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPrivacy('connections_only')}
                className={`p-3.5 rounded-[18px] border text-left text-[13px] transition-all active:scale-98 ${
                  privacy === 'connections_only'
                    ? isDark
                      ? 'bg-[#A390E4]/20 border-[#A390E4]/50 text-white font-bold'
                      : 'bg-[#7C65C1]/12 border-[#7C65C1]/40 text-black font-bold'
                    : isDark
                    ? 'bg-[#2C2C2E] border-white/[0.06] text-[#8E8E93]'
                    : 'bg-white border-black/[0.04] text-[#636366]'
                }`}
              >
                <Users size={16} className={`mb-1.5 ${isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'}`} />
                <p>Apenas Conexões</p>
              </button>

              <button
                type="button"
                onClick={() => setPrivacy('members_only')}
                className={`p-3.5 rounded-[18px] border text-left text-[13px] transition-all active:scale-98 ${
                  privacy === 'members_only'
                    ? isDark
                      ? 'bg-[#A390E4]/20 border-[#A390E4]/50 text-white font-bold'
                      : 'bg-[#7C65C1]/12 border-[#7C65C1]/40 text-black font-bold'
                    : isDark
                    ? 'bg-[#2C2C2E] border-white/[0.06] text-[#8E8E93]'
                    : 'bg-white border-black/[0.04] text-[#636366]'
                }`}
              >
                <Lock size={16} className={`mb-1.5 ${isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'}`} />
                <p>Apenas Membros</p>
              </button>

              <button
                type="button"
                onClick={() => setPrivacy('anyone')}
                className={`p-3.5 rounded-[18px] border text-left text-[13px] transition-all active:scale-98 ${
                  privacy === 'anyone'
                    ? isDark
                      ? 'bg-[#A390E4]/20 border-[#A390E4]/50 text-white font-bold'
                      : 'bg-[#7C65C1]/12 border-[#7C65C1]/40 text-black font-bold'
                    : isDark
                    ? 'bg-[#2C2C2E] border-white/[0.06] text-[#8E8E93]'
                    : 'bg-white border-black/[0.04] text-[#636366]'
                }`}
              >
                <Globe size={16} className={`mb-1.5 ${isDark ? 'text-[#A390E4]' : 'text-[#7C65C1]'}`} />
                <p>Qualquer Pessoa</p>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé com Fricção Positiva Apple iOS */}
        <div
          className={`p-5 border-t flex items-center justify-between ${
            isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2.5 text-[14px] font-semibold transition-colors ${
              isDark ? 'text-[#8E8E93] hover:text-white' : 'text-[#636366] hover:text-black'
            }`}
          >
            Descartar
          </button>

          {isLongPost ? (
            <div className="relative">
              <button
                disabled={!content.trim()}
                onMouseDown={() => setIsHolding(true)}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={() => setIsHolding(true)}
                onTouchEnd={() => setIsHolding(false)}
                className={`relative overflow-hidden px-6 py-2.5 rounded-full text-[14px] font-bold transition-all select-none border shadow-md active:scale-95 ${
                  isDark
                    ? 'bg-[#2C2C2E] text-white border-white/[0.1]'
                    : 'bg-[#F2F2F7] text-black border-black/[0.1]'
                }`}
              >
                <div
                  className={`absolute inset-0 transition-all duration-100 ease-linear ${
                    isDark ? 'bg-[#A390E4]' : 'bg-[#7C65C1]'
                  }`}
                  style={{ width: `${holdProgress}%` }}
                />
                <span className="relative z-10 flex items-center gap-1.5">
                  {isHolding ? `Revisando... (${Math.round((3 * (100 - holdProgress)) / 100)}s)` : 'Segure 3s para Publicar'}
                </span>
              </button>
            </div>
          ) : (
            <button
              disabled={!content.trim()}
              onClick={handleFinalPublish}
              className={`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all text-white shadow-sm active:scale-95 ${
                content.trim()
                  ? isDark
                    ? 'bg-[#A390E4] hover:bg-[#9887C4]'
                    : 'bg-[#7C65C1] hover:bg-[#6C55B1]'
                  : 'bg-stone-300 dark:bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              Publicar Ideia
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
