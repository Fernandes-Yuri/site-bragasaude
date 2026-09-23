import { CheckCircle2, Droplet, HeartPulse, Pill, Share2 } from "lucide-react";
import type { DailyBulletin } from "../types";

interface DailyBulletinCardProps {
  bulletin: DailyBulletin | null;
  patientName: string;
  isLoading?: boolean;
  onToast?: (message: string, type?: "success" | "error") => void;
}

const formatLiters = (ml: number) => `${(ml / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} L`;

export function DailyBulletinCard({ bulletin, patientName, isLoading, onToast }: DailyBulletinCardProps) {
  if (isLoading) return <div className="h-48 rounded-2xl bg-white border border-[#E5EBE8] animate-pulse" />;
  if (!bulletin) return null;

  const medicationPct = bulletin.medicationsExpected > 0
    ? Math.round((bulletin.medicationsTaken / bulletin.medicationsExpected) * 100)
    : 0;
  const pressure = bulletin.latestBloodPressure;
  const pressureTime = pressure
    && pressure.measuredAt
    ? new Date(pressure.measuredAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;
  const useBrazilianPressureScale = Boolean(pressure && pressure.systolic >= 100);
  const pressureLabel = pressure
    ? `${useBrazilianPressureScale ? Math.round(pressure.systolic / 10) : pressure.systolic}/${useBrazilianPressureScale ? Math.round(pressure.diastolic / 10) : pressure.diastolic}`
    : null;
  const shareText = `Boletim Braga Saúde - ${patientName || "seu familiar"}: Remédios do dia ${medicationPct}% tomados, ${pressure ? `pressão ${pressureLabel}${pressureTime ? ` às ${pressureTime}` : ""}` : "pressão ainda não aferida"} e ${formatLiters(bulletin.hydrationMl)} de água. ${medicationPct === 100 ? "Tudo tranquilo por aqui!" : "Seguimos acompanhando por aqui."}`;

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Boletim Braga Saúde", text: shareText });
      else window.location.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    } catch (error) {
      if ((error as Error).name !== "AbortError") onToast?.("Não foi possível abrir o compartilhamento.", "error");
    }
  };

  return (
    <section className="rounded-2xl border border-[#B2DFDB] bg-white p-5 shadow-sm" aria-labelledby="daily-bulletin-title">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#00897B]">Resumo de hoje</p>
          <h3 id="daily-bulletin-title" className="text-lg font-black text-[#1E293B]">Boletim do dia</h3>
        </div>
        {medicationPct === 100 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#2E7D32]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Em dia
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-[#F4FBF9] p-3 text-center"><Pill className="w-5 h-5 mx-auto mb-1.5 text-[#00897B]" /><strong className="block text-sm">{bulletin.medicationsTaken} de {bulletin.medicationsExpected}</strong><span className="text-[11px] text-[#64748B]">remédios</span></div>
        <div className="rounded-xl bg-[#FFF5F2] p-3 text-center"><HeartPulse className="w-5 h-5 mx-auto mb-1.5 text-[#D9532F]" /><strong className="block text-sm">{pressureLabel || "--"}</strong><span className="text-[11px] text-[#64748B]">{pressureTime || "sem aferição"}</span></div>
        <div className="rounded-xl bg-[#F0F8FF] p-3 text-center"><Droplet className="w-5 h-5 mx-auto mb-1.5 text-[#0277BD]" /><strong className="block text-sm">{bulletin.hydrationMl} ml</strong><span className="text-[11px] text-[#64748B]">de {bulletin.hydrationTargetMl}</span></div>
      </div>
      <button onClick={handleShare} className="mt-4 w-full rounded-xl bg-[#00897B] px-4 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-[#00695C]">
        <Share2 className="w-4 h-4" /> Compartilhar no WhatsApp
      </button>
    </section>
  );
}
