import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const { isDark } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Verificar se já está rodando em modo standalone (PWA instalado)
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(checkStandalone);

    if (checkStandalone) {
      return;
    }

    // Verificar se o usuário já dispensou hoje
    const dismissedAt = localStorage.getItem('slowsocial_pwa_dismissed');
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 48) {
        return;
      }
    }

    // Detectar iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Evento nativo do Android / Chrome / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // No iOS, se não estiver standalone, sugerir após um tempo suave de navegação
    if (isIosDevice && !checkStandalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('slowsocial_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <>
      {/* 1. Barra Flutuante Minimalista de Instalação (Padrão Apple Inset) */}
      <aside
        aria-label="Instalação do Aplicativo"
        className="fixed top-3.5 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-50 animate-pop-in pointer-events-auto"
      >
        <div
          className={`rounded-[22px] p-3.5 backdrop-blur-2xl border shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 transition-colors ${
            isDark
              ? 'bg-[#1C1C1E]/95 border-white/[0.12] text-white'
              : 'bg-white/95 border-black/[0.08] text-black'
          }`}
        >
          {/* Ícone e Textos */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/icons/apple-touch-icon.png"
              alt="Ícone do Slow Social"
              className="w-11 h-11 rounded-[12px] shadow-sm ring-1 ring-black/5 shrink-0 object-cover"
            />
            <div className="min-w-0">
              <h4 className="text-[13.5px] font-bold tracking-tight truncate leading-tight">
                Slow Social App
              </h4>
              <p
                className={`text-[12px] truncate ${
                  isDark ? 'text-[#8E8E93]' : 'text-[#636366]'
                }`}
              >
                Instale no seu smartphone
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                isDark
                  ? 'bg-[#A390E4] hover:bg-[#9887C4] text-[#121214]'
                  : 'bg-[#7C65C1] hover:bg-[#6C55B1] text-white'
              }`}
            >
              <Download size={13} strokeWidth={2.4} />
              <span>Instalar</span>
            </button>

            <button
              onClick={handleDismiss}
              className={`p-1.5 rounded-full transition-colors ${
                isDark
                  ? 'text-[#8E8E93] hover:text-white hover:bg-white/10'
                  : 'text-[#8E8E93] hover:text-black hover:bg-black/5'
              }`}
              title="Fechar lembrete"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Modal de Instruções Especial para iOS Safari */}
      {showIOSInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-modal-title"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[max(env(safe-area-inset-top),24px)] sm:pt-16 overflow-y-auto bg-black/60 backdrop-blur-sm animate-view-enter"
        >
          <div
            className={`w-full max-w-sm rounded-[28px] p-6 space-y-5 border shadow-2xl transition-all ${
              isDark
                ? 'bg-[#1C1C1E] border-white/10 text-white'
                : 'bg-white border-black/10 text-black'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/apple-touch-icon.png"
                  alt="Slow Social"
                  className="w-12 h-12 rounded-[14px] shadow-sm"
                />
                <div>
                  <h3 id="ios-modal-title" className="text-[17px] font-bold">Instalar no iPhone</h3>
                  <p className={`text-[12.5px] ${isDark ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                    Experiência nativa em tela cheia
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className={`p-1.5 rounded-full ${
                  isDark ? 'text-[#8E8E93] hover:text-white' : 'text-[#636366] hover:text-black'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[14px]">
              <div className="flex items-center gap-3 p-3 rounded-[16px] bg-black/[0.03] dark:bg-white/[0.05]">
                <div className="w-8 h-8 rounded-full bg-[#7C65C1]/15 text-[#7C65C1] dark:text-[#A390E4] flex items-center justify-center font-bold text-[13px] shrink-0">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <span>Toque no botão</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-md text-[13px]">
                    <Share size={13} /> Compartilhar
                  </span>
                  <span>no Safari</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-[16px] bg-black/[0.03] dark:bg-white/[0.05]">
                <div className="w-8 h-8 rounded-full bg-[#7C65C1]/15 text-[#7C65C1] dark:text-[#A390E4] flex items-center justify-center font-bold text-[13px] shrink-0">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <span>Role e selecione</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-stone-800 dark:text-stone-200 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md text-[13px]">
                    <PlusSquare size={13} /> Adicionar à Tela de Início
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-[16px] bg-black/[0.03] dark:bg-white/[0.05]">
                <div className="w-8 h-8 rounded-full bg-[#7C65C1]/15 text-[#7C65C1] dark:text-[#A390E4] flex items-center justify-center font-bold text-[13px] shrink-0">
                  3
                </div>
                <span>Confirme tocando em <strong>Adicionar</strong> no topo direito. Pronto!</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSInstructions(false);
                handleDismiss();
              }}
              className={`w-full py-3 rounded-full text-[14px] font-bold text-white transition-all shadow-sm active:scale-95 ${
                isDark ? 'bg-[#A390E4] text-[#121214]' : 'bg-[#7C65C1]'
              }`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
