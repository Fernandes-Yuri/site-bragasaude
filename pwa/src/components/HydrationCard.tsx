import React, { useState } from "react";
import { Droplet, Volume2, Sparkles } from "lucide-react";
import type { HydrationRecord } from "../types";

import { triggerBragaVoiceReminder } from "../services/api";

interface HydrationCardProps {
  hydration: HydrationRecord;
  patientName: string;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({ hydration, patientName }) => {
  const [isSending, setIsSending] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  const percentage = Math.min(100, Math.round((hydration.currentMl / hydration.targetMl) * 100));

  const handleRemindWater = async () => {
    setIsSending(true);
    await triggerBragaVoiceReminder("patient-1", `Dona ${patientName.split(" ")[1] || "Odete"}, que tal beber um copo d'água agora para bater sua meta de hidratação?`);
    setIsSending(false);
    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 4000);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
            <Droplet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-white">Hidratação do Dia</h4>
            <p className="text-[11px] text-slate-400">{hydration.lastIntakeAt}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base font-bold text-cyan-400">{hydration.currentMl}</span>
          <span className="text-xs text-slate-400 font-normal"> / {hydration.targetMl} ml</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-3 relative">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700 shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-medium text-slate-400">
          {percentage}% da meta diária concluída
        </span>

        <button
          onClick={handleRemindWater}
          disabled={isSending}
          className="text-xs text-cyan-400 hover:text-cyan-300 active:text-cyan-200 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {sentNotice ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Lembrete enviado!</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSending ? "Enviando..." : "Lembrar de beber água"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
