import React, { useState } from "react";
import { X, Shield, Clock, Trash2, AlertTriangle, UserCheck, Calendar } from "lucide-react";
import type { FamilyBinding } from "../types";
import { Avatar } from "./Avatar";

interface FamilyMemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  binding: FamilyBinding | null;
  currentUserId: string;
  /** Fotos de perfil dos membros por userId. */
  memberPhotos?: Record<string, string>;
  onRevoke: (binding: FamilyBinding) => Promise<void>;
  onGoToDashboard?: () => void;
}

export const FamilyMemberProfileModal: React.FC<FamilyMemberProfileModalProps> = ({
  isOpen,
  onClose,
  binding,
  currentUserId,
  memberPhotos,
  onRevoke,
  onGoToDashboard,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  if (!isOpen || !binding) return null;

  const isCaredByMe = binding.patientUserId !== currentUserId;
  const displayName = isCaredByMe
    ? (binding.patientName || "Familiar Acompanhado")
    : (binding.caregiverName || "Familiar Cuidador");

  const memberPhoto = isCaredByMe
    ? memberPhotos?.[binding.patientUserId]
    : memberPhotos?.[binding.caregiverUserId];

  const formattedDate = new Date(binding.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handleConfirmRevoke = async () => {
    setIsRevoking(true);
    try {
      await onRevoke(binding);
      setShowConfirm(false);
      onClose();
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E5EBE8] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top bar */}
        <div className="px-5 py-4 border-b border-[#E5EBE8] flex items-center justify-between bg-white">
          <h2 className="text-base font-bold text-[#1E293B]">Perfil do Familiar</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Fechar perfil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Avatar e Nome */}
          <div className="flex flex-col items-center text-center space-y-2 pt-2">
            <Avatar
              name={displayName}
              photoUrl={memberPhoto}
              className="w-20 h-20 bg-gradient-to-b from-[#26A69A] to-[#00897B] shadow-md shadow-emerald-900/20 border-2 border-white"
              textClassName="text-2xl"
            />
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">{displayName}</h3>
              <p className="text-xs text-[#64748B]">
                {binding.caregiverRelation || "Vínculo familiar"}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2F1] text-[#00897B] text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5" />
              {isCaredByMe ? "Você acompanha este familiar" : "Este familiar te acompanha"}
            </div>
          </div>

          {/* Dados do vínculo */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4 space-y-2.5 border border-[#E2E8F0]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Papel relacional:</span>
              <span className="font-semibold text-[#1E293B]">{binding.caregiverRelation || "Familiar"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Status do vínculo:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Ativo
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Conectado em:
              </span>
              <span className="font-semibold text-[#1E293B]">{formattedDate}</span>
            </div>
          </div>

          {/* Aviso de retenção efêmera D47 / LGPD */}
          <div className="bg-[#E0F2F1]/50 rounded-2xl p-3.5 border border-[#B2DFDB] flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-[#00897B] shrink-0 mt-0.5" />
            <div className="text-xs text-[#004D40] leading-relaxed">
              <p className="font-semibold mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#00897B]" /> Retenção efêmera de 24 horas (D47)
              </p>
              <p>
                As mensagens trocadas nesta conversa expiram e são purgadas automaticamente após 24 horas. Nenhum dado permanente fica retido no servidor.
              </p>
            </div>
          </div>

          {/* Atalho para o painel se for familiar acompanhado */}
          {isCaredByMe && onGoToDashboard && (
            <button
              onClick={() => {
                onClose();
                onGoToDashboard();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00897B] text-white text-xs font-bold active:scale-98 transition-all hover:bg-[#00796B]"
            >
              Abrir Painel Clínico de {displayName}
            </button>
          )}

          {/* Botão de Excluir Vínculo */}
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold active:scale-98 transition-all hover:bg-rose-100 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Excluir Vínculo Familiar
            </button>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2 text-rose-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Tem certeza que deseja excluir o vínculo com <strong>{displayName}</strong>? O acesso ao histórico, sinais vitais e mensagens será interrompido imediatamente.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={isRevoking}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevoke}
                  disabled={isRevoking}
                  className="flex-1 py-2 px-3 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isRevoking ? (
                    <span>Excluindo...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sim, excluir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
