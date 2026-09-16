import React, { useState } from "react";
import { PhoneCall, ShieldCheck, CheckCircle2 } from "lucide-react";
import {
  DEFAULT_CAREGIVER_STATE,
  DEFAULT_GROCERY_ITEMS,
  DEFAULT_HISTORY_7D,
  QUICK_TEMPLATES,
  sendCaregiverMessage,
} from "./services/api";
import type { CaregiverDashboardState, GroceryItem } from "./types";
import { DesktopGateModal } from "./components/DesktopGateModal";
import { EmeraldHeaderBanner } from "./components/EmeraldHeaderBanner";
import { PatientHeaderCard } from "./components/PatientHeaderCard";
import { TodayVitalsCard } from "./components/TodayVitalsCard";
import { HistoryMetricsSection } from "./components/HistoryMetricsSection";
import { QuickActionsChips } from "./components/QuickActionsChips";
import { SharedGroceryListCard } from "./components/SharedGroceryListCard";
import { QuickMessagesCard } from "./components/QuickMessagesCard";
import {
  MedicationReminderDialog,
  AppointmentDialog,
  CareNoteDialog,
} from "./components/CaregiverDialogs";
import { FamilyConnectModal } from "./components/FamilyConnectModal";

export const App: React.FC = () => {
  const [dashboard, setDashboard] = useState<CaregiverDashboardState>(DEFAULT_CAREGIVER_STATE);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(DEFAULT_GROCERY_ITEMS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estados dos modais de diálogo
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showCareNoteDialog, setShowCareNoteDialog] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleGrocery = (id: string) => {
    setGroceryItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCheckedInPantry: !item.isCheckedInPantry } : item
      )
    );
  };

  const handleSendQuickTemplate = async (templateKey: string) => {
    const template = QUICK_TEMPLATES[templateKey];
    if (!template) return;

    await sendCaregiverMessage(
      dashboard.patientUserId,
      template.text,
      template.iconType === "water"
        ? "WATER"
        : template.iconType === "medication"
        ? "MEDICATION"
        : template.iconType === "walk"
        ? "WALK"
        : "LOVE",
      dashboard.caregiverName
    );

    showToast(`Mensagem enviada: "${template.label}"`);
  };

  const handleRefresh = () => {
    setDashboard((prev) => ({ ...prev, isLoading: true }));
    setTimeout(() => {
      setDashboard((prev) => ({
        ...prev,
        isLoading: false,
        lastMeasurementLabel: "Atualizado agora mesmo",
      }));
      showToast("Dados sincronizados com sucesso");
    }, 700);
  };

  const handleEmergencyCall = () => {
    window.location.href = "tel:192";
  };

  return (
    <div className="min-h-screen bg-[#FAFCFB] text-[#1E293B] flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-[#E5EBE8] select-none font-sans">
      {/* 1. Bloqueio para Desktop com tela exclusiva e QR Code */}
      <DesktopGateModal />

      {/* 2. Cabeçalho Curvo Esmeralda Oficial */}
      <EmeraldHeaderBanner
        title="Acompanhamento"
        subtitle="Cuidado Diário & Família Conectada"
        patientName={dashboard.patientName}
        onRefresh={handleRefresh}
        onConnectFamily={() => setShowConnectModal(true)}
        onOpenChat={() => setShowCareNoteDialog(true)}
      />

      {/* Indicador de sincronização sutil */}
      {dashboard.isLoading && (
        <div className="w-full h-1 bg-[#E0F2F1] overflow-hidden">
          <div className="w-full h-full bg-[#00897B] animate-pulse" />
        </div>
      )}

      {/* Conteúdo Principal Rolável */}
      <main className="p-4 space-y-4 flex-1 pb-24 overflow-y-auto">
        {/* Identificação do Familiar Acompanhado */}
        <PatientHeaderCard state={dashboard} />

        {/* Card de Sinais Vitais de Hoje */}
        <TodayVitalsCard state={dashboard} />

        {/* Ações Rápidas em Chips Horizontais */}
        <QuickActionsChips
          onMedicationReminder={() => setShowMedicationDialog(true)}
          onAppointment={() => setShowAppointmentDialog(true)}
          onCareNote={() => setShowCareNoteDialog(true)}
          onFamilyPost={() => showToast("Publicação adicionada ao Círculo Familiar")}
        />

        {/* Histórico e Tendências (7d / 30d) */}
        <HistoryMetricsSection history7d={DEFAULT_HISTORY_7D} />

        {/* Lista de Compras Compartilhada da Semana */}
        <SharedGroceryListCard
          items={groceryItems}
          patientName={dashboard.patientName}
          onToggle={handleToggleGrocery}
        />

        {/* Mensagens Rápidas de 1 Toque */}
        <QuickMessagesCard
          templates={QUICK_TEMPLATES}
          onSend={handleSendQuickTemplate}
        />

        {/* Botão de Emergência Rápido SAMU 192 */}
        <div className="pt-1">
          <button
            onClick={handleEmergencyCall}
            className="w-full bg-[#FFF5F2] hover:bg-[#FFEAE4] active:scale-98 border border-[#D9532F]/30 rounded-2xl p-3.5 text-[#D9532F] flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-2xs"
          >
            <PhoneCall className="w-4 h-4 text-[#D9532F]" />
            <span>Contato de Emergência / SAMU 192</span>
          </button>
        </div>
      </main>

      {/* Barra Inferior Fixa com Safe Area iOS */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#E5EBE8] pb-safe pt-2 px-6 flex items-center justify-between text-[#64748B] text-[11px] z-40">
        <div className="flex items-center gap-1.5 text-[#00897B] font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Ponte Familiar Segura</span>
        </div>
        <div className="flex items-center gap-1 text-[#64748B]">
          <span>Braga Saúde</span>
          <span>·</span>
          <span>Modo Cuidador</span>
        </div>
      </footer>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] text-white px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#26A69A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Diálogos Modais */}
      <MedicationReminderDialog
        isOpen={showMedicationDialog}
        onClose={() => setShowMedicationDialog(false)}
        onSend={(text) => {
          sendCaregiverMessage(dashboard.patientUserId, text, "MEDICATION", dashboard.caregiverName);
          showToast("Lembrete de medicação enviado para o familiar");
        }}
      />

      <AppointmentDialog
        isOpen={showAppointmentDialog}
        onClose={() => setShowAppointmentDialog(false)}
        onSend={(spec, date) => {
          sendCaregiverMessage(dashboard.patientUserId, `Consulta agendada: ${spec} em ${date}`, "APPOINTMENT", dashboard.caregiverName);
          showToast("Consulta médica salva e notificada");
        }}
      />

      <CareNoteDialog
        isOpen={showCareNoteDialog}
        onClose={() => setShowCareNoteDialog(false)}
        onSend={(text) => {
          sendCaregiverMessage(dashboard.patientUserId, text, "LOVE", dashboard.caregiverName);
          showToast("Bilhete de carinho enviado com sucesso");
        }}
      />

      <FamilyConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccessPair={(patientName, relation) => {
          setDashboard((prev) => ({
            ...prev,
            patientName,
            caregiverRelation: relation,
            lastMeasurementLabel: "Novo familiar conectado",
          }));
          showToast(`Conectado com sucesso a ${patientName}!`);
        }}
      />
    </div>
  );
};

export default App;
