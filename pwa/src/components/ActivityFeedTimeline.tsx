import { CheckCircle2, HeartPulse, Pill, Users } from "lucide-react";
import type { ActivityFeedItem } from "../types";

function activityCopy(item: ActivityFeedItem): string {
  const details = item.details as Record<string, string | number | undefined>;
  if (item.actionType.includes("MEDICATION")) return `${item.actorName} marcou ${details.medication_name || details.medicationName || "um medicamento"}`;
  if (item.actionType.includes("VITAL")) return `${item.actorName} registrou ${details.systolic && details.diastolic ? `pressão ${details.systolic}/${details.diastolic}` : "um sinal vital"}`;
  if (item.actionType.includes("SYMPTOM")) return `${item.actorName} registrou como está se sentindo`;
  return `${item.actorName} atualizou o cuidado`;
}

export function ActivityFeedTimeline({ items }: { items: ActivityFeedItem[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-2xl border border-[#E5EBE8] bg-white p-5 shadow-sm" aria-labelledby="activity-title">
      <div className="flex items-center gap-2.5 mb-4"><div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center"><Users className="w-4 h-4" /></div><div><h3 id="activity-title" className="font-bold">Quem cuidou hoje</h3><p className="text-xs text-[#64748B]">Atualizações compartilhadas com a família</p></div></div>
      <ol className="space-y-0">
        {items.slice(0, 8).map((item, index) => {
          const Icon = item.actionType.includes("MEDICATION") ? Pill : item.actionType.includes("VITAL") ? HeartPulse : CheckCircle2;
          return <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < Math.min(items.length, 8) - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-[#B2DFDB]" />}
            <span className="z-10 w-8 h-8 shrink-0 rounded-full bg-[#F4FBF9] border border-[#B2DFDB] text-[#00897B] flex items-center justify-center"><Icon className="w-4 h-4" /></span>
            <div className="min-w-0 pt-0.5"><p className="text-sm font-semibold text-[#1E293B]">{activityCopy(item)}</p><p className="text-xs text-[#64748B]">{new Date(item.occurredAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p></div>
          </li>;
        })}
      </ol>
    </section>
  );
}
