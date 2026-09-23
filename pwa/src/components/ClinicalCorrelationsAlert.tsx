import { BrainCircuit, CalendarDays } from "lucide-react";
import type { ClinicalCorrelation } from "../types";

export function ClinicalCorrelationsAlert({ correlations }: { correlations: ClinicalCorrelation[] }) {
  if (!correlations.length) return null;
  const correlation = correlations[0];
  const tone = correlation.severity === "HIGH" ? "border-[#D9532F]/30 bg-[#FFF5F2]" : "border-[#B2DFDB] bg-[#F4FBF9]";
  return (
    <section className={`rounded-2xl border p-4 ${tone}`} aria-labelledby="correlation-title">
      <div className="flex gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-white text-[#00695C] flex items-center justify-center shadow-sm"><BrainCircuit className="w-5 h-5" /></div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#00695C]">IA preventiva</p>
          <h3 id="correlation-title" className="font-bold text-[#1E293B]">{correlation.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#475569]">{correlation.description}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#64748B]"><CalendarDays className="w-3.5 h-3.5" /> Observado em {new Date(correlation.observedAt).toLocaleDateString("pt-BR")}</p>
        </div>
      </div>
    </section>
  );
}
