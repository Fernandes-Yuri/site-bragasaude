import React from "react";
import { MessageCircle, ChevronRight, User, UserPlus, Clock } from "lucide-react";
import type { FamilyBinding } from "../types";

interface FamilyInboxListProps {
  groups: FamilyBinding[];
  currentUserId: string;
  onSelectGroup: (patientUserId: string) => void;
  onOpenProfile: (binding: FamilyBinding) => void;
  onConnectFamily: () => void;
}

export const FamilyInboxList: React.FC<FamilyInboxListProps> = ({
  groups,
  currentUserId,
  onSelectGroup,
  onOpenProfile,
  onConnectFamily,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
      {/* Banner de topo */}
      <div className="px-4 py-3.5 bg-white border-b border-[#E5EBE8]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-[#1E293B]">Conversas da Família</h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E0F2F1] text-[#00897B]">
            {groups.length} conversa{groups.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#00897B]" />
          <span>Retenção efêmera de 24 horas (D47)</span>
        </div>
      </div>

      {/* Lista ou Estado Vazio */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {groups.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E293B] mb-1">Nenhuma conversa ativa</h3>
              <p className="text-xs text-[#64748B] max-w-xs leading-relaxed">
                Conecte familiares para trocar bilhetes de carinho e acompanhar a rotina com privacidade.
              </p>
            </div>
            <button
              onClick={onConnectFamily}
              className="mt-2 py-2 px-4 rounded-xl bg-[#00897B] text-white text-xs font-bold active:scale-98 transition-all hover:bg-[#00796B] flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Conectar familiar
            </button>
          </div>
        ) : (
          groups.map((binding, index) => {
            const isCaredByMe = binding.patientUserId !== currentUserId;
            const displayName = binding.patientUserId === currentUserId
              ? "Minha família"
              : (binding.patientName || `Familiar ${index + 1}`);

            const initials = displayName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((n) => n.charAt(0).toUpperCase())
              .join("") || "F";

            return (
              <div
                key={binding.patientUserId || binding.id}
                className="bg-white rounded-2xl p-3.5 border border-[#E5EBE8] shadow-2xs hover:border-[#B2DFDB] transition-all flex items-center gap-3 group"
              >
                {/* Avatar clicável */}
                <button
                  type="button"
                  onClick={() => onSelectGroup(binding.patientUserId)}
                  className="w-12 h-12 rounded-full bg-gradient-to-b from-[#26A69A] to-[#00897B] flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-xs"
                >
                  {initials}
                </button>

                {/* Conteúdo principal */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSelectGroup(binding.patientUserId)}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-bold text-[#1E293B] truncate">
                      {displayName}
                    </p>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {isCaredByMe ? "Você acompanha" : "Te acompanha"}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] truncate mt-0.5">
                    {binding.caregiverRelation || "Vínculo familiar"} · Toque para conversar
                  </p>
                </div>

                {/* Botão de Perfil */}
                <button
                  type="button"
                  onClick={() => onOpenProfile(binding)}
                  title="Ver perfil do familiar"
                  aria-label="Ver perfil do familiar"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#00897B] hover:bg-[#E0F2F1] active:scale-95 transition-all shrink-0"
                >
                  <User className="w-4 h-4" />
                </button>

                {/* Seta para abrir */}
                <button
                  type="button"
                  onClick={() => onSelectGroup(binding.patientUserId)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 group-hover:text-[#00897B] transition-colors shrink-0"
                  aria-label="Abrir conversa"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
