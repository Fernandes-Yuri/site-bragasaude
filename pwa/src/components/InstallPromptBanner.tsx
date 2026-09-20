import React, { useState, useEffect } from "react";
import { Share, PlusSquare, X, Download, Smartphone } from "lucide-react";

export const InstallPromptBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Verifica se o usuário já dispensou o aviso nesta semana
    const dismissed = localStorage.getItem("braga_install_banner_dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Se dispensou há menos de 3 dias, não exibe
      if (Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // 2. Verifica se o app já está rodando em modo Standalone (PWA Instalado)
    const isStandalone =
      ("standalone" in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isStandalone) {
      return;
    }

    // 3. Detecção de iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // Exibe após 2.5 segundos para não sobrecarregar o primeiro impacto visual
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }

    // 4. Captura de evento de instalação nativo no Android / Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("braga_install_banner_dismissed", Date.now().toString());
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-16 left-3 right-3 max-w-md mx-auto z-45 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#1E293B] text-white p-4 rounded-3xl shadow-2xl border border-white/15 backdrop-blur-lg flex flex-col gap-3">
        {/* Topo do Banner com Fechar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00897B] text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Instalar o Braga Cuidador</p>
              <p className="text-[10px] text-[#64748B]">
                Acesse como aplicativo direto na sua tela inicial
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Fechar"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instruções Específicas para iOS Safari */}
        {isIos ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#26A69A] font-semibold text-[11px]">
              <span>No Safari do seu iPhone:</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-200">
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0 text-[#26A69A]">
                <Share className="w-3.5 h-3.5" />
              </div>
              <span>
                1. Toque no botão de <strong>Compartilhar</strong> (barra inferior).
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-200">
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0 text-[#26A69A]">
                <PlusSquare className="w-3.5 h-3.5" />
              </div>
              <span>
                2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
              </span>
            </div>
          </div>
        ) : (
          /* Botão de Instalação Nativa Android/Chrome */
          <button
            onClick={handleNativeInstall}
            className="w-full bg-[#00897B] hover:bg-[#00796B] active:scale-98 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/20"
          >
            <Download className="w-4 h-4" />
            <span>Adicionar à Tela Inicial</span>
          </button>
        )}

        {/* Botão de dispensar */}
        <div className="flex justify-end">
          <button
            onClick={handleDismiss}
            className="text-[10px] text-[#64748B] hover:text-white transition-colors"
          >
            Agora não, continuar pelo navegador
          </button>
        </div>
      </div>
    </div>
  );
};