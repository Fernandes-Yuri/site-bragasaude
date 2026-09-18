import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";

/**
 * Chip persistente "Instalar app".
 *
 * No Android/Chrome usa o evento beforeinstallprompt (instalação nativa, um toque).
 * No iOS não existe esse evento — a instalação é guiada pelo InstallPromptBanner
 * (guia "Compartilhar > Adicionar à Tela de Início"), por isso o chip fica oculto lá.
 * Quando o app já está instalado (modo standalone), o chip não é exibido.
 */
export const InstallAppChip: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const isStandalone =
      ("standalone" in window.navigator &&
        (window.navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // iOS: sem beforeinstallprompt — o banner guia a instalação. Chip oculto.
  if (isIos || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-semibold text-xs shrink-0 active:scale-95 transition-all shadow-2xs"
      style={{
        backgroundColor: "rgba(0, 137, 123, 0.08)",
        borderColor: "rgba(0, 137, 123, 0.2)",
        color: "#00897B",
      }}
    >
      <Download className="w-4 h-4" />
      <span>Instalar app</span>
    </button>
  );
};
