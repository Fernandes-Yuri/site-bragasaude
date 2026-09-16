import React, { useState } from "react";
import { X, MessageSquare, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { sendPhoneOtp, verifyPhoneOtp } from "../services/api";

interface PhoneLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone: string) => void;
  initialPhone?: string;
}

export const PhoneLinkDialog: React.FC<PhoneLinkDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = "",
}) => {
  const [phone, setPhone] = useState(initialPhone);
  const [otpCode, setOtpCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      setError("Informe o DDD e o número completo do WhatsApp.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await sendPhoneOtp(phone);
    setIsLoading(false);

    if (res.success) {
      setCodeSent(true);
      if (res.waLink) setWaLink(res.waLink);
    } else {
      setError(res.message || "Não foi possível enviar o código agora.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setError("Digite o código de 6 dígitos recebido.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await verifyPhoneOtp(phone, otpCode);
    setIsLoading(false);

    if (res.success) {
      onSuccess(phone);
      onClose();
    } else {
      setError(res.message || "Código incorreto. Tente novamente.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#E5EBE8] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#1E293B] text-base">Vincular seu WhatsApp</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#64748B] hover:text-[#1E293B] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FFF5F2] border border-[#D9532F]/30 flex items-center gap-2 text-xs text-[#D9532F]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!codeSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-xs text-[#64748B] leading-relaxed">
              Cadastre seu WhatsApp para receber alertas prioritários do familiar e mensagens de emergência em tempo real.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#1E293B] block mb-1">
                Número do WhatsApp com DDD
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-8888"
                className="w-full bg-[#FAFCFB] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1E293B] focus:border-[#00897B] outline-hidden"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#64748B]"
              >
                Agora não
              </button>
              <button
                type="submit"
                disabled={isLoading || phone.replace(/\D/g, "").length < 10}
                className="px-5 py-2.5 rounded-xl bg-[#00897B] hover:bg-[#00695C] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <span>{isLoading ? "Enviando..." : "Enviar código"}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#1E293B] font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all"
              >
                <span>Abrir conversa no WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#25D366]" />
              </a>
            )}

            <p className="text-xs text-[#64748B] leading-relaxed">
              Enviamos um código de 6 dígitos no seu WhatsApp (<strong>{phone}</strong>). Digite-o abaixo para confirmar:
            </p>

            <div>
              <label className="text-xs font-semibold text-[#1E293B] block mb-1">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full bg-[#FAFCFB] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-center text-xl font-mono font-bold tracking-widest text-[#1E293B] focus:border-[#00897B] outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setOtpCode("");
                }}
                className="text-xs font-medium text-[#64748B] hover:text-[#00897B]"
              >
                Trocar número
              </button>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="px-5 py-2.5 rounded-xl bg-[#00897B] hover:bg-[#00695C] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isLoading ? "Validando..." : "Confirmar"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
