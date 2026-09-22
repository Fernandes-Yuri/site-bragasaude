import React from "react";
import { Heart, Droplet, Footprints } from "lucide-react";
import type { CaregiverDashboardState } from "../types";

interface TodayVitalsCardProps {
  state: CaregiverDashboardState;
}

export const TodayVitalsCard: React.FC<TodayVitalsCardProps> = ({ state }) => {
  const hydrationPct =
    state.hydrationTargetMl > 0
      ? Math.max(0, Math.min(100, Math.round((state.hydrationMl / state.hydrationTargetMl) * 100)))
      : 0;

  const stepsPct =
    state.stepGoal > 0
      ? Math.max(0, Math.min(100, Math.round((state.steps / state.stepGoal) * 100)))
      : 0;

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-[#E5EBE8] shadow-sm">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5F2] text-[#D9532F] flex items-center justify-center">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <h3 className="text-base font-bold text-[#1E293B]">Sinais vitais</h3>
        </div>
        {state.lastMeasurementLabel && (
          <span className="text-sm text-[#64748B] font-medium">
            {state.lastMeasurementLabel}
          </span>
        )}
      </div>

      {/* Mini-cards de Pressão e Glicose */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 mb-4">
        {/* Pressão Arterial */}
        <div className="bg-[#F4FBF9] border border-[#E5EBE8] rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
            <Heart className="w-3.5 h-3.5 text-[#D9532F]" />
            <span>Pressão arterial</span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-[#1E293B]">
              {state.systolic ? `${state.systolic}/${state.diastolic || "--"}` : "--"}
            </span>
            <span className="text-sm font-medium text-[#64748B]">mmHg</span>
          </div>
        </div>

        {/* Glicose */}
        <div className="bg-[#F4FBF9] border border-[#E5EBE8] rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
            <Droplet className="w-3.5 h-3.5 text-[#E65100]" />
            <span>Glicose</span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-[#1E293B]">
              {state.glucose ? `${state.glucose}` : "--"}
            </span>
            <span className="text-sm font-medium text-[#64748B]">mg/dL</span>
          </div>
        </div>
      </div>

      {/* Barra de Progresso: Hidratação */}
      <div className="bg-[#F4FBF9] border border-[#B2DFDB]/60 rounded-2xl p-3.5 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0277BD]/10 text-[#0277BD] flex items-center justify-center">
              <Droplet className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-sm font-semibold text-[#1E293B]">Hidratação</span>
          </div>
          <span className="text-sm font-bold text-[#1E293B]">{state.hydrationMl} ml</span>
        </div>

        <div role="progressbar" aria-label="Meta de hidratação" aria-valuemin={0} aria-valuemax={100} aria-valuenow={hydrationPct} className="w-full h-2 bg-[#0277BD]/15 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full bg-gradient-to-r from-[#0277BD] to-[#26A69A] rounded-full transition-all duration-500 motion-reduce:transition-none"
            style={{ width: `${hydrationPct}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-[#64748B]">
          <span>Meta: {state.hydrationTargetMl} ml</span>
          <span>{hydrationPct}%</span>
        </div>
      </div>

      {/* Barra de Progresso: Passos */}
      <div className="bg-[#F4FBF9] border border-[#B2DFDB]/60 rounded-2xl p-3.5 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#00695C]/10 text-[#00695C] flex items-center justify-center">
              <Footprints className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-[#1E293B]">Passos</span>
          </div>
          <span className="text-sm font-bold text-[#1E293B]">{state.steps}</span>
        </div>

        <div role="progressbar" aria-label="Meta de passos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stepsPct} className="w-full h-2 bg-[#00695C]/15 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full bg-gradient-to-r from-[#00695C] to-[#00A884] rounded-full transition-all duration-500 motion-reduce:transition-none"
            style={{ width: `${stepsPct}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-[#64748B]">
          <span>Meta: {state.stepGoal} passos</span>
          <span>{stepsPct}%</span>
        </div>
      </div>

      {/* Rodapé informativo sutil */}
      <p className="text-sm text-[#64748B] pt-1 text-center">
        Leituras autorreportadas ou medidas no dia pelo próprio familiar.
      </p>
    </div>
  );
};
