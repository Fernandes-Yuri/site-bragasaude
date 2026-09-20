import React from "react";
import { User } from "lucide-react";
import type { CaregiverDashboardState } from "../types";

interface PatientHeaderCardProps {
  state: CaregiverDashboardState;
}

export const PatientHeaderCard: React.FC<PatientHeaderCardProps> = ({ state }) => {
  const displayRelation = (state.caregiverRelation || "Familiar")
    .replace(/["']/g, "")
    .replace(/\([aã]\)/g, "")
    .trim()
    .toLowerCase();

  return (
    <div className="w-full bg-white rounded-2xl p-4 border border-[#E5EBE8] shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3.5">
        {/* Avatar com fundo Esmeralda Oficial */}
        <div className="w-12 h-12 rounded-full bg-[#00897B] text-white flex items-center justify-center shadow-sm font-bold text-lg shrink-0">
          {state.patientName ? state.patientName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1E293B] truncate tracking-tight">
            {state.patientName || "Seu familiar"}
          </h2>
          <p className="text-xs text-[#64748B]">
            Você acompanha como <span className="font-medium text-[#1E293B] capitalize">{displayRelation}</span>
          </p>
        </div>
      </div>

      {/* Badge de Vínculo Ativo (exato ao Kotlin) */}
      {/* AUD-PW(B): antes era renderizada SEMPRE — falso-positivo clínico.
           Sem vínculo, o cuidador via "Ativo" verde pulsante sobre um
           paciente que não estava conectado. Agora só aparece com vínculo. */}
      {state.hasActiveBinding && (
        <div className="px-2.5 py-1 rounded-full bg-[#E8F5E9] border border-[#4CAF50]/40 flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
          <span className="text-xs font-semibold text-[#2E7D32]">Ativo</span>
        </div>
      )}
    </div>
  );
};
