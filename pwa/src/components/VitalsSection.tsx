import { Activity, Heart, Droplet, Scale, ChevronRight } from "lucide-react";
import type { VitalRecord } from "../types";



interface VitalsSectionProps {
  vitals: VitalRecord[];
  onOpenCharts: () => void;
}

export const VitalsSection: React.FC<VitalsSectionProps> = ({ vitals, onOpenCharts }) => {
  const pressure = vitals.find((v) => v.type === "pressure");
  const glucose = vitals.find((v) => v.type === "glucose");
  const heartRate = vitals.find((v) => v.type === "heart_rate");
  const weight = vitals.find((v) => v.type === "weight");

  const getPressureStatus = (sys?: number, dia?: number) => {
    if (!sys || !dia) return { label: "Sem dados", color: "bg-slate-800 text-slate-400" };
    if (sys < 120 && dia < 80) return { label: "Ótima", color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" };
    if (sys <= 129 && dia <= 84) return { label: "Normal", color: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" };
    if (sys <= 139 || dia <= 89) return { label: "Limítrofe", color: "bg-amber-500/20 text-amber-300 border border-amber-500/40" };
    return { label: "Atenção", color: "bg-rose-500/20 text-rose-300 border border-rose-500/40" };
  };

  const pressureStatus = getPressureStatus(pressure?.systolic, pressure?.diastolic);

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium tracking-wide text-slate-400 uppercase">Sinais Vitais de Hoje</h3>
        <button
          onClick={onOpenCharts}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 transition-colors"
        >
          Ver histórico
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Pressão Arterial */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
              <Activity className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pressureStatus.color}`}>
              {pressureStatus.label}
            </span>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-white">
              {pressure ? `${pressure.systolic}/${pressure.diastolic}` : "--/--"}
            </span>
            <span className="text-xs text-slate-400 ml-1">mmHg</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Pressão Arterial</span>
            <span className="text-slate-500">{pressure?.timestamp.replace("Hoje às ", "")}</span>
          </p>
        </div>

        {/* Glicemia */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Droplet className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Em Jejum
            </span>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-white">
              {glucose?.value || "--"}
            </span>
            <span className="text-xs text-slate-400 ml-1">mg/dL</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Glicemia</span>
            <span className="text-slate-500">{glucose?.timestamp.replace("Hoje às ", "")}</span>
          </p>
        </div>

        {/* Batimentos Cardíacos */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Batimentos</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">{heartRate?.value || 72}</span>
                <span className="text-[10px] text-slate-500">bpm</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-medium text-emerald-400">Ritmo regular</span>
        </div>

        {/* Peso Atual */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Peso Acompanhado</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">{weight?.value || 65.4}</span>
                <span className="text-[10px] text-slate-500">kg</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Estável</span>
        </div>
      </div>
    </div>
  );
};
