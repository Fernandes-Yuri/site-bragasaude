import React, { useState, useEffect } from "react";
import { Share2, PlusSquare, X } from "lucide-react";

export const InstallBanner: React.FC = () => {
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const standaloneMode = (window.navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    
    setIsIos(isIosDevice);
    setIsStandalone(standaloneMode);
    
    const dismissed = localStorage.getItem("pwa_install_dismissed");
    if (dismissed) setIsDismissed(true);
  }, []);

  if (isStandalone || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  return (
    <div className="bg-emerald-950/90 border border-emerald-700/60 backdrop-blur-md rounded-2xl p-4 text-white shadow-xl mb-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-md">
            <PlusSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-emerald-100">Instalar App do Cuidador</h4>
            <p className="text-xs text-emerald-300/90 mt-0.5 leading-relaxed">
              {isIos ? (
                <>
                  No Safari, toque no botão <strong>Compartilhar</strong> <Share2 className="w-3.5 h-3.5 inline text-emerald-300 mx-0.5" /> e depois em <strong>"Adicionar à Tela de Início"</strong>.
                </>
              ) : (
                "Instale este aplicativo na sua tela de início para receber alertas de saúde em tempo real."
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-emerald-400 hover:text-white p-1 rounded-lg transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
