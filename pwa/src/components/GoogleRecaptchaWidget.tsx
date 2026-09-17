import React, { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../services/firebase";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface GoogleRecaptchaWidgetProps {
  onToken: (token: string | null) => void;
}

export const GoogleRecaptchaWidget: React.FC<GoogleRecaptchaWidgetProps> = ({ onToken }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [errorNotice, setErrorNotice] = useState(false);

  useEffect(() => {
    let active = true;

    const setupVerifier = async () => {
      if (!containerRef.current) return;
      try {
        if (verifierRef.current) {
          try {
            verifierRef.current.clear();
          } catch {
            /* ignore */
          }
        }

        const verifier = new RecaptchaVerifier(auth, containerRef.current, {
          size: "normal",
          callback: (response: string) => {
            if (!active) return;
            setIsVerified(true);
            onToken(response || "google-recaptcha-verified");
          },
          "expired-callback": () => {
            if (!active) return;
            setIsVerified(false);
            onToken(null);
          },
        });

        verifierRef.current = verifier;
        await verifier.render();
      } catch (err) {
        console.warn("Falha ao inicializar Google RecaptchaVerifier:", err);
        if (active) {
          setErrorNotice(true);
        }
      }
    };

    setupVerifier();

    return () => {
      active = false;
      if (verifierRef.current) {
        try {
          verifierRef.current.clear();
        } catch {
          /* ignore */
        }
      }
    };
  }, [onToken]);

  // Se o Google reCAPTCHA não carregar (bloqueador de anúncios, rede restrita),
  // falhamos FECHADO: nenhum token é emitido e o login permanece bloqueado.
  // Antes existia um bypass "não sou um robô" que aprovava qualquer clique com
  // um token falso — era segurança ilusória e foi removido.
  if (errorNotice) {
    return (
      <div className="my-3">
        <div className="w-full max-w-[300px] border border-[#D9532F]/30 bg-[#FFF5F2] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[#D9532F]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Verificação de segurança indisponível</p>
            <p className="text-[#B91C1C] mt-0.5 leading-relaxed">
              Não foi possível carregar a verificação Google. Desative bloqueadores
              de anúncios nesta página e recarregue.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setErrorNotice(false);
            setIsVerified(false);
            onToken(null);
          }}
          className="mt-2 text-xs font-semibold text-[#00897B] hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="my-3 flex flex-col items-center min-h-[78px] justify-center">
      <div ref={containerRef} id="firebase-recaptcha-container" />
      {isVerified && (
        <div className="flex items-center gap-1.5 text-xs text-[#00897B] font-medium mt-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verificação Google concluída</span>
        </div>
      )}
    </div>
  );
};