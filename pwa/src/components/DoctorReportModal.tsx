import { useEffect, useState } from "react";
import { Clock3, Download, ExternalLink, FileText, LoaderCircle, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import { downloadDoctorReportPdf, generateMedicalAccess } from "../services/api";
import type { MedicalAccessGrant } from "../types";

interface DoctorReportModalProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  getIdToken: () => Promise<string | undefined>;
  onClose: () => void;
  onToast: (message: string, type?: "success" | "error") => void;
}

export function DoctorReportModal({ isOpen, patientId, patientName, getIdToken, onClose, onToast }: DoctorReportModalProps) {
  const [busy, setBusy] = useState<"pdf" | "qr" | null>(null);
  const [grant, setGrant] = useState<MedicalAccessGrant | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setGrant(null);
      setQrImage(null);
      setBusy(null);
      onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!grant) return;
    QRCode.toDataURL(grant.qrCodePayload, { width: 280, margin: 2, color: { dark: "#004D40", light: "#FFFFFF" } }).then(setQrImage).catch(() => onToast("Não foi possível desenhar o QR Code.", "error"));
  }, [grant, onToast]);
  if (!isOpen) return null;

  const handleClose = () => {
    setGrant(null);
    setQrImage(null);
    setBusy(null);
    onClose();
  };

  const handlePdf = async () => {
    setBusy("pdf");
    try {
      const blob = await downloadDoctorReportPdf(patientId, 30, await getIdToken());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `relatorio-${(patientName || "paciente").toLowerCase().replace(/\s+/g, "-")}-30-dias.pdf`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onToast("Relatório de 30 dias baixado com sucesso.");
    } catch (error) { onToast((error as Error).message, "error"); } finally { setBusy(null); }
  };
  const handleQr = async () => {
    setBusy("qr");
    try { setGrant(await generateMedicalAccess(patientId, await getIdToken())); }
    catch (error) { onToast((error as Error).message, "error"); } finally { setBusy(null); }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#0F172A]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="doctor-report-title">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#00897B]">Consulta organizada</p><h2 id="doctor-report-title" className="text-xl font-black">Leva pro Doutor</h2><p className="text-sm text-[#64748B]">Resumo clínico de {patientName || "seu familiar"}</p></div><button autoFocus onClick={handleClose} aria-label="Fechar" className="rounded-full text-[#64748B]"><X className="w-5 h-5" /></button></div>
        <div className="space-y-3">
          <button onClick={handlePdf} disabled={busy !== null} className="w-full rounded-2xl border border-[#B2DFDB] bg-[#F4FBF9] p-4 text-left flex gap-3 disabled:opacity-60">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-white text-[#00897B] flex items-center justify-center"><FileText className="w-5 h-5" /></span><span className="flex-1"><strong className="block text-sm">Baixar relatório PDF</strong><span className="text-xs text-[#64748B]">Uma página com o resumo dos últimos 30 dias</span></span>{busy === "pdf" ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 text-[#00897B]" />}
          </button>
          <button onClick={handleQr} disabled={busy !== null} className="w-full rounded-2xl border border-[#B2DFDB] bg-white p-4 text-left flex gap-3 disabled:opacity-60">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-[#E0F2F1] text-[#00897B] flex items-center justify-center"><QrCode className="w-5 h-5" /></span><span className="flex-1"><strong className="block text-sm">Gerar QR Code de consulta</strong><span className="text-xs text-[#64748B]">Acesso seguro e temporário, sem cadastro</span></span>{busy === "qr" && <LoaderCircle className="w-5 h-5 animate-spin" />}
          </button>
        </div>
        {grant && <div className="mt-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-center">
          {qrImage && <img src={qrImage} alt="QR Code de acesso médico temporário" className="w-56 h-56 mx-auto rounded-xl" />}
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#475569]"><Clock3 className="w-3.5 h-3.5" /> Expira em {new Date(grant.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          <a href={grant.magicLink} target="_blank" rel="noreferrer" className="mt-3 min-h-12 rounded-xl bg-[#004D40] px-4 py-3 text-sm font-bold text-white flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Abrir link médico</a>
        </div>}
      </div>
    </div>
  );
}
