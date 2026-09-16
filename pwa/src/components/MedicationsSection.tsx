import React, { useState } from "react";
import { Pill, CheckCircle2, Clock, Volume2, Sparkles } from "lucide-react";
import type { MedicationSchedule } from "../types";

import { triggerBragaVoiceReminder } from "../services/api";

interface MedicationsSectionProps {
  medications: MedicationSchedule[];
  patientName: string;
}

export const MedicationsSection: React.FC<MedicationsSectionProps> = ({ medications, patientName }) => {
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleVoiceReminder = async (med: MedicationSchedule) => {
    setRemindingId(med.id);
    const text = `Dona ${patientName.split(" ")[1] || "Odete"}, o seu familiar pediu para o Braga te lembrar de tomar o ${med.name} de ${med.dosage}.`;
    await triggerBragaVoiceReminder("patient-1", text);
    
    setRemindingId(null);
    setSuccessMessage(`Lembrete de voz enviado para o assistente da ${patientName.split(" ")[1] || "mãe"}!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const takenCount = medications.filter((m) => m.isTaken).length;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-medium tracking-wide text-slate-400 uppercase">Medicamentos</h3>
          <p className="text-xs text-slate-400">
            {takenCount} de {medications.length} doses tomadas hoje
          </p>
        </div>
        <div className="w-10 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(takenCount / medications.length) * 100}%` }}
          />
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="space-y-2">
        {medications.map((med) => (
          <div
            key={med.id}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between shadow-sm ${
              med.isTaken
                ? "bg-slate-900/40 border-slate-800/40 opacity-80"
                : "bg-slate-900/90 border-slate-700/80 shadow-md"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  med.isTaken ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                }`}
              >
                <Pill className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-white">{med.name}</h4>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {med.dosage}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Horário: {med.time}</span>
                  {med.takenAt && (
                    <span className="text-emerald-400 font-medium">· Tomado às {med.takenAt}</span>
                  )}
                </p>
              </div>
            </div>

            <div>
              {med.isTaken ? (
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium px-2 py-1 bg-emerald-500/10 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tomado</span>
                </div>
              ) : (
                <button
                  onClick={() => handleVoiceReminder(med)}
                  disabled={remindingId === med.id}
                  className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Enviar comando de voz para o assistente Braga lembrar"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{remindingId === med.id ? "Enviando..." : "Lembrar"}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
