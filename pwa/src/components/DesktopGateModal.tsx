import React, { useState, useEffect } from "react";
import { Smartphone, QrCode } from "lucide-react";

interface DesktopGateModalProps {
  onBypassDev?: () => void;
}

export const DesktopGateModal: React.FC<DesktopGateModalProps> = ({ onBypassDev }) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [bypassed, setBypassed] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      const isWide = window.innerWidth > 768;
      setIsDesktop(isWide);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  if (!isDesktop || bypassed) return null;

  const currentAppUrl = "https://braga-saude.web.app/app/";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentAppUrl
  )}&bgcolor=FFFFFF&color=00897B&margin=1`;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFCFB] flex flex-col items-center justify-center p-6 text-center select-text">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#E5EBE8] flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mb-5 shadow-sm">
          <Smartphone className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-[#1E293B] tracking-tight mb-2">
          Aplicativo Exclusivo para Celular
        </h2>

        <p className="text-sm text-[#64748B] leading-relaxed mb-6">
          O <strong>Braga Saúde Cuidador</strong> foi desenvolvido para uso em smartphones (iOS e Android) e para instalação direta na Tela de Início.
        </p>

        <div className="bg-[#F4FBF9] border border-[#B2DFDB] rounded-2xl p-4 mb-6 flex flex-col items-center shadow-inner">
          <img
            src={qrCodeUrl}
            alt="QR Code para abrir no celular"
            className="w-48 h-48 rounded-xl shadow-sm"
          />
          <div className="flex items-center gap-1.5 text-xs text-[#00897B] font-semibold mt-3">
            <QrCode className="w-4 h-4" />
            <span>Aponte a câmera do seu iPhone ou Android</span>
          </div>
        </div>

        <p className="text-xs text-[#64748B] mb-6">
          Ou acesse diretamente pelo Safari no celular: <br />
          <span className="font-mono text-[#00897B] font-semibold">braga-saude.web.app</span>
        </p>

        <button
          onClick={() => {
            setBypassed(true);
            onBypassDev?.();
          }}
          className="text-xs text-[#64748B] hover:text-[#00897B] underline underline-offset-4 transition-colors"
        >
          Visualizar em modo simulador desktop
        </button>
      </div>
    </div>
  );
};
