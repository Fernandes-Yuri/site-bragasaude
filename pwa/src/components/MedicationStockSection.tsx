import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Barcode, Camera, CheckCircle2, LoaderCircle, MessageCircle, PackagePlus, Pill, ShoppingCart, X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { createMedication, fetchAnvisaByBarcode } from "../services/api";
import type { BarcodeMedication, MedicationStockItem } from "../types";

interface MedicationStockSectionProps {
  items: MedicationStockItem[];
  patientId: string;
  patientName: string;
  mode?: "alert" | "full";
  getIdToken: () => Promise<string | undefined>;
  onAddToShoppingList: (item: MedicationStockItem) => void;
  onMedicationCreated: () => void;
  onToast: (message: string, type?: "success" | "error") => void;
}

export function MedicationStockSection(props: MedicationStockSectionProps) {
  const critical = useMemo(() => props.items.filter((item) => item.isCritical || item.daysRemaining <= 5), [props.items]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualEan, setManualEan] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [medicine, setMedicine] = useState<BarcodeMedication | null>(null);
  const [schedule, setSchedule] = useState("08:00");
  const [units, setUnits] = useState(30);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    if (!scannerOpen) return;
    const reader = new Html5Qrcode("ean-reader", { formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13], verbose: false });
    reader.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 280, height: 150 } }, (decodedText) => {
      setManualEan(decodedText); reader.stop().catch(() => undefined); void lookup(decodedText);
    }, () => undefined).catch(() => props.onToast("Não foi possível abrir a câmera. Digite o EAN abaixo.", "error"));
    return () => {
      if (reader.isScanning) reader.stop().catch(() => undefined).finally(() => { try { reader.clear(); } catch { /* leitor já liberado */ } });
      else { try { reader.clear(); } catch { /* câmera não chegou a iniciar */ } }
    };
  // lookup uses stable props callbacks in this one-shot camera lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  useEffect(() => {
    if (!scannerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setScannerOpen(false);
      setMedicine(null);
      setManualEan("");
      setConfirmed(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [scannerOpen]);

  const lookup = async (ean = manualEan) => {
    const clean = ean.replace(/\D/g, "");
    if (!/^\d{13}$/.test(clean)) { props.onToast("Digite um código EAN-13 válido.", "error"); return; }
    setLookupBusy(true);
    try { setMedicine(await fetchAnvisaByBarcode(clean, await props.getIdToken())); }
    catch (error) { props.onToast((error as Error).message, "error"); }
    finally { setLookupBusy(false); }
  };

  const closeScanner = () => { setScannerOpen(false); setMedicine(null); setManualEan(""); setConfirmed(false); };
  const saveMedication = async () => {
    if (!medicine || !confirmed) return;
    setSaving(true);
    try {
      await createMedication(props.patientId, {
        eanBarcode: medicine.eanBarcode, name: medicine.name, activePrinciple: medicine.activePrinciple,
        manufacturer: medicine.manufacturer, pharmaceuticalForm: medicine.pharmaceuticalForm,
        scheduleTimes: [schedule], totalUnits: units, alertThresholdDays: 5, confirmedWithPrescription: true,
      }, await props.getIdToken());
      props.onToast("Medicamento cadastrado e estoque atualizado."); closeScanner(); props.onMedicationCreated();
    } catch (error) { props.onToast((error as Error).message, "error"); } finally { setSaving(false); }
  };

  const notifyWhatsApp = (item: MedicationStockItem) => {
    const text = `Atenção ao estoque de ${item.name} para ${props.patientName || "nosso familiar"}: restam cerca de ${item.daysRemaining} dias. Precisamos providenciar a reposição.`;
    window.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  if (!props.patientId) return null;

  if (props.mode === "alert") {
    if (!critical.length) return null;
    const item = critical[0];
    return <section className="rounded-2xl border border-[#F59E0B]/40 bg-[#FFFBEB] p-4" aria-label="Alerta de estoque crítico">
      <div className="flex gap-3"><AlertTriangle className="w-5 h-5 shrink-0 text-[#B45309]" /><div className="min-w-0 flex-1"><p className="font-bold text-[#7C2D12]">Estoque precisa de atenção</p><p className="mt-1 text-sm text-[#78350F]">{item.name} tem estoque para apenas {item.daysRemaining} {item.daysRemaining === 1 ? "dia" : "dias"}. Providencie a compra.</p>
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => props.onAddToShoppingList(item)} className="min-h-10 rounded-xl bg-[#00897B] px-3 py-2 text-xs font-bold text-white flex items-center gap-1.5"><ShoppingCart className="w-4 h-4" /> Lista de compras</button><button onClick={() => notifyWhatsApp(item)} className="min-h-10 rounded-xl border border-[#D97706]/30 bg-white px-3 py-2 text-xs font-bold text-[#92400E] flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Avisar no WhatsApp</button></div>
      </div></div>{critical.length > 1 && <p className="mt-2 text-xs font-semibold text-[#92400E]">Mais {critical.length - 1} {critical.length === 2 ? "medicamento precisa" : "medicamentos precisam"} de reposição.</p>}</section>;
  }

  return <>
    <section className="rounded-2xl border border-[#E5EBE8] bg-white p-5 shadow-sm" aria-labelledby="stock-title">
      <div className="flex items-start justify-between gap-3 mb-4"><div className="flex gap-2.5"><div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center"><Pill className="w-4 h-4" /></div><div><h3 id="stock-title" className="font-bold">Farmácia e reposição</h3><p className="text-xs text-[#64748B]">Estoque estimado dos medicamentos</p></div></div></div>
      <div className="space-y-3">
        {props.items.length === 0 ? <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-center text-sm text-[#64748B]">Nenhum medicamento cadastrado.</p> : props.items.map((item) => {
          const pct = item.totalUnits > 0 ? Math.min(100, Math.max(0, Math.round((item.currentUnits / item.totalUnits) * 100))) : 0;
          const low = item.isCritical || item.daysRemaining <= 5;
          return <article key={item.id} className="rounded-xl border border-[#E5EBE8] p-3">
            <div className="flex gap-3">{item.photoReferenceUrl ? <img src={item.photoReferenceUrl} alt={`Referência de ${item.name}`} className="w-12 h-12 rounded-lg object-cover border border-[#E5EBE8]" /> : <div className="w-12 h-12 rounded-lg bg-[#F4FBF9] text-[#00897B] flex items-center justify-center"><Pill className="w-5 h-5" /></div>}<div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><h4 className="text-sm font-bold truncate">{item.name}</h4><p className="text-xs text-[#64748B] truncate">{item.activePrinciple || item.pharmaceuticalForm || "Uso conforme receita"}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${low ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-[#E8F5E9] text-[#2E7D32]"}`}>{item.daysRemaining} dias</span></div>
              <div className="mt-2 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden"><div className={`h-full rounded-full ${low ? "bg-[#D9532F]" : "bg-[#00897B]"}`} style={{ width: `${pct}%` }} /></div><p className="mt-1 text-[11px] text-[#64748B]">{item.currentUnits} de {item.totalUnits} unidades</p></div></div>
          </article>;
        })}
      </div>
      <button onClick={() => setScannerOpen(true)} className="mt-4 w-full rounded-xl border border-[#00897B] bg-white px-4 py-3 text-sm font-bold text-[#00695C] flex items-center justify-center gap-2"><Barcode className="w-4 h-4" /> Cadastrar com código de barras</button>
    </section>

    {scannerOpen && <div className="fixed inset-0 z-[70] bg-[#0F172A]/60 backdrop-blur-sm flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="scanner-title"><div className="w-full max-w-md max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3 mb-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#00897B]">Cadastro seguro</p><h2 id="scanner-title" className="text-xl font-black">Ler código da caixa</h2></div><button autoFocus onClick={closeScanner} aria-label="Fechar leitor" className="rounded-full text-[#64748B]"><X className="w-5 h-5" /></button></div>
      {!medicine && <><div className="rounded-2xl overflow-hidden bg-[#0F172A] min-h-48 relative"><div id="ean-reader" className="w-full" /><div className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Aponte para o EAN-13</div></div>
        <div className="mt-4"><label htmlFor="manual-ean" className="text-sm font-semibold">Ou digite os 13 números</label><div className="mt-1.5 flex gap-2"><input id="manual-ean" value={manualEan} onChange={(event) => setManualEan(event.target.value.replace(/\D/g, "").slice(0, 13))} inputMode="numeric" placeholder="7891234567890" className="min-w-0 flex-1 rounded-xl border border-[#CBD5E1] px-3" /><button onClick={() => lookup()} disabled={lookupBusy} className="rounded-xl bg-[#00897B] px-4 text-sm font-bold text-white disabled:opacity-60">{lookupBusy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : "Buscar"}</button></div></div></>}
      {medicine && <div className="space-y-4"><div className="rounded-2xl border border-[#B2DFDB] bg-[#F4FBF9] p-4"><div className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-[#00897B]" /><div><p className="font-bold">{medicine.name}{medicine.concentration ? ` ${medicine.concentration}` : ""}</p><p className="text-sm text-[#475569]">{medicine.activePrinciple || "Princípio ativo não informado"}</p><p className="text-xs text-[#64748B]">{medicine.manufacturer || "Laboratório não informado"} · {medicine.pharmaceuticalForm || "Forma não informada"}</p></div></div></div>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Horário<input type="time" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#CBD5E1] px-3" /></label><label className="text-sm font-semibold">Unidades<input type="number" min={0} max={10000} value={units} onChange={(e) => setUnits(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-[#CBD5E1] px-3" /></label></div>
        <label className="flex items-start gap-3 rounded-xl border border-[#B2DFDB] p-3 cursor-pointer"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 w-5 h-5 accent-[#00897B]" /><span><strong className="block text-sm">Conferido com a receita médica</strong><span className="text-xs text-[#64748B]">Obrigatório antes de cadastrar</span></span></label>
        <button onClick={saveMedication} disabled={!confirmed || saving} className="w-full rounded-xl bg-[#00897B] px-4 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50">{saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />} Cadastrar medicamento</button>
      </div>}
    </div></div>}
  </>;
}
