import React, { useState, useEffect } from "react";
import { PhoneCall, ShieldCheck, CheckCircle2, MessageSquare, UserPlus } from "lucide-react";
import {
  auth,
  signOut,
  onAuthStateChanged,
  type User,
} from "./services/firebase";
import {
  DEFAULT_CAREGIVER_STATE,
  DEFAULT_GROCERY_ITEMS,
  DEFAULT_HISTORY_7D,
  QUICK_TEMPLATES,
  sendCaregiverMessage,
  fetchFamilyBindings,
  fetchPatientVitals,
} from "./services/api";
import type { CaregiverDashboardState, GroceryItem } from "./types";
import { EmeraldHeaderBanner } from "./components/EmeraldHeaderBanner";
import { PatientHeaderCard } from "./components/PatientHeaderCard";
import { TodayVitalsCard } from "./components/TodayVitalsCard";
import { QuickActionsChips } from "./components/QuickActionsChips";
import { SharedGroceryListCard } from "./components/SharedGroceryListCard";
import { QuickMessagesCard } from "./components/QuickMessagesCard";

// Code-Splitting: componentes pesados carregados sob demanda
const LoginScreen = React.lazy(() =>
  import("./components/LoginScreen").then((m) => ({ default: m.LoginScreen }))
);
const DesktopGateModal = React.lazy(() =>
  import("./components/DesktopGateModal").then((m) => ({ default: m.DesktopGateModal }))
);
const HistoryMetricsSection = React.lazy(() =>
  import("./components/HistoryMetricsSection").then((m) => ({ default: m.HistoryMetricsSection }))
);
const FamilyConnectModal = React.lazy(() =>
  import("./components/FamilyConnectModal").then((m) => ({ default: m.FamilyConnectModal }))
);
const PhoneLinkDialog = React.lazy(() =>
  import("./components/PhoneLinkDialog").then((m) => ({ default: m.PhoneLinkDialog }))
);
const MedicationReminderDialog = React.lazy(() =>
  import("./components/CaregiverDialogs").then((m) => ({ default: m.MedicationReminderDialog }))
);
const AppointmentDialog = React.lazy(() =>
  import("./components/CaregiverDialogs").then((m) => ({ default: m.AppointmentDialog }))
);
const CareNoteDialog = React.lazy(() =>
  import("./components/CaregiverDialogs").then((m) => ({ default: m.CareNoteDialog }))
);

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [dashboard, setDashboard] = useState<CaregiverDashboardState>(DEFAULT_CAREGIVER_STATE);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(DEFAULT_GROCERY_ITEMS);
  const [historyRecords, setHistoryRecords] = useState(DEFAULT_HISTORY_7D);
  const [hasRealBinding, setHasRealBinding] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estados dos modais de diálogo
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showCareNoteDialog, setShowCareNoteDialog] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPhoneLinkDialog, setShowPhoneLinkDialog] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Monitorar autenticação do Firebase em tempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        const displayName = user.displayName || user.email?.split("@")[0] || "Cuidador";
        setDashboard((prev) => ({
          ...prev,
          caregiverName: displayName,
        }));

        // Buscar telefone salvo localmente ou no backend
        const savedPhone = localStorage.getItem(`braga_phone_${user.uid}`);
        if (savedPhone) setUserPhone(savedPhone);

        // Buscar vínculos reais do usuário
        try {
          const idToken = await user.getIdToken();
          const bindings = await fetchFamilyBindings(user.uid, idToken);
          if (bindings.length > 0) {
            const active = bindings[0];
            setHasRealBinding(true);
            setDashboard((prev) => ({
              ...prev,
              patientUserId: active.patientUserId,
              patientName: active.caregiverName ? `Familiar de ${displayName}` : "Familiar Conectado",
              caregiverRelation: active.caregiverRelation || "Cuidador",
            }));

            // Buscar sinais vitais reais do paciente
            const vitals = await fetchPatientVitals(active.patientUserId, idToken);
            if (vitals.length > 0) {
              setHistoryRecords(vitals);
              const latest = vitals[0];
              setDashboard((prev) => ({
                ...prev,
                systolic: latest.systolic ?? prev.systolic,
                diastolic: latest.diastolic ?? prev.diastolic,
                glucose: latest.glucose ?? prev.glucose,
                hydrationMl: latest.hydrationMl ?? prev.hydrationMl,
                steps: latest.steps ?? prev.steps,
                lastMeasurementLabel: "Medição real recebida",
              }));
            }
          }
        } catch (err) {
          console.warn("Falha ao sincronizar dados iniciais:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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

  const handleRefresh = async () => {
    setDashboard((prev) => ({ ...prev, isLoading: true }));
    try {
      if (currentUser) {
        const idToken = await currentUser.getIdToken(true);
        const bindings = await fetchFamilyBindings(currentUser.uid, idToken);
        if (bindings.length > 0) {
          const vitals = await fetchPatientVitals(bindings[0].patientUserId, idToken);
          if (vitals.length > 0) setHistoryRecords(vitals);
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => {
        setDashboard((prev) => ({
          ...prev,
          isLoading: false,
          lastMeasurementLabel: "Sincronizado agora",
        }));
        showToast("Dados atualizados com sucesso");
      }, 500);
    }
  };

  const handleEmergencyCall = () => {
    window.location.href = "tel:192";
  };

  const handleLogout = async () => {
    await signOut(auth);
    setHasRealBinding(false);
    showToast("Sessão encerrada com sucesso.");
  };

  // 1. Tela de Carregamento de Sessão
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FAFCFB] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-3 border-[#E0F2F1] border-t-[#00897B] animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#1E293B]">Carregando sessão segura...</p>
      </div>
    );
  }

  // 2. Tela de Login se não estiver autenticado
  if (!currentUser) {
    return (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#FAFCFB] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full border-3 border-[#E0F2F1] border-t-[#00897B] animate-spin mb-4" />
            <p className="text-sm font-semibold text-[#1E293B]">Carregando portal seguro...</p>
          </div>
        }
      >
        <DesktopGateModal />
        <LoginScreen onSuccess={() => showToast("Login efetuado com sucesso!")} />
      </React.Suspense>
    );
  }

  // 3. Dashboard do Cuidador Autenticado
  return (
    <div className="min-h-screen bg-[#FAFCFB] text-[#1E293B] flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-[#E5EBE8] select-none font-sans">
      {/* Bloqueio para Desktop com tela exclusiva e QR Code */}
      <React.Suspense fallback={null}>
        <DesktopGateModal />
      </React.Suspense>

      {/* Cabeçalho Curvo Esmeralda Oficial com Logout e WhatsApp */}
      <EmeraldHeaderBanner
        title="Acompanhamento"
        subtitle={`Cuidador: ${dashboard.caregiverName}`}
        patientName={dashboard.patientName}
        onRefresh={handleRefresh}
        onConnectFamily={() => setShowConnectModal(true)}
        onOpenChat={() => setShowCareNoteDialog(true)}
        onLinkWhatsApp={() => setShowPhoneLinkDialog(true)}
        onLogout={handleLogout}
      />

      {/* Indicador de sincronização sutil */}
      {dashboard.isLoading && (
        <div className="w-full h-1 bg-[#E0F2F1] overflow-hidden">
          <div className="w-full h-full bg-[#00897B] animate-pulse" />
        </div>
      )}

      {/* Conteúdo Principal Rolável */}
      <main className="p-4 space-y-4 flex-1 pb-24 overflow-y-auto">
        {/* Banner de Lembrete para Vincular WhatsApp se ainda não tiver número */}
        {!userPhone && (
          <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <MessageSquare className="w-5 h-5 text-[#F57F17] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1E293B]">Vincule seu WhatsApp</p>
                <p className="text-[11px] text-[#64748B] truncate">
                  Receba avisos de saúde e emergência direto no WhatsApp.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPhoneLinkDialog(true)}
              className="px-3 py-1.5 rounded-xl bg-[#00897B] text-white text-xs font-bold shrink-0 active:scale-95 transition-all"
            >
              Vincular
            </button>
          </div>
        )}

        {/* Banner de Orientação se ainda não tiver familiar conectado */}
        {!hasRealBinding && (
          <div className="bg-[#E0F2F1]/50 border border-[#B2DFDB] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00897B] text-white flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E293B]">Conectar Novo Familiar</p>
                <p className="text-[11px] text-[#64748B]">
                  Use o código de 8 dígitos gerado no celular do paciente.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#00897B] text-white text-xs font-bold shrink-0 hover:bg-[#00695C] transition-colors"
            >
              Conectar
            </button>
          </div>
        )}

        {/* Identificação do Familiar Acompanhado */}
        <PatientHeaderCard state={dashboard} />

        {/* Card de Sinais Vitais de Hoje */}
        <TodayVitalsCard state={dashboard} />

        {/* Ações Rápidas em Chips Horizontais */}
        <QuickActionsChips
          onMedicationReminder={() => setShowMedicationDialog(true)}
          onAppointment={() => setShowAppointmentDialog(true)}
          onCareNote={() => setShowCareNoteDialog(true)}
          onFamilyPost={() => showToast("Publicação compartilhada com a família")}
        />

        {/* Histórico e Tendências (7d / 30d) com dados reais (Lazy Loaded) */}
        <React.Suspense
          fallback={
            <div className="bg-white rounded-3xl p-5 border border-[#E5EBE8] shadow-xs my-2 animate-pulse">
              <div className="h-4 w-36 bg-slate-200 rounded-md mb-3" />
              <div className="h-40 bg-slate-100 rounded-2xl" />
            </div>
          }
        >
          <HistoryMetricsSection history7d={historyRecords} />
        </React.Suspense>

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
          <span>Sessão Protegida</span>
        </div>
        <div className="flex items-center gap-1 text-[#64748B]">
          <span>{userPhone || currentUser.email}</span>
        </div>
      </footer>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] text-white px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#26A69A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Diálogos Modais (Lazy Loaded Sob Demanda) */}
      <React.Suspense fallback={null}>
        {showMedicationDialog && (
          <MedicationReminderDialog
            isOpen={showMedicationDialog}
            onClose={() => setShowMedicationDialog(false)}
            onSend={(text) => {
              sendCaregiverMessage(dashboard.patientUserId, text, "MEDICATION", dashboard.caregiverName);
              showToast("Lembrete de medicação enviado para o familiar");
            }}
          />
        )}

        {showAppointmentDialog && (
          <AppointmentDialog
            isOpen={showAppointmentDialog}
            onClose={() => setShowAppointmentDialog(false)}
            onSend={(spec, date) => {
              sendCaregiverMessage(dashboard.patientUserId, `Consulta agendada: ${spec} em ${date}`, "APPOINTMENT", dashboard.caregiverName);
              showToast("Consulta médica salva e notificada");
            }}
          />
        )}

        {showCareNoteDialog && (
          <CareNoteDialog
            isOpen={showCareNoteDialog}
            onClose={() => setShowCareNoteDialog(false)}
            onSend={(text) => {
              sendCaregiverMessage(dashboard.patientUserId, text, "LOVE", dashboard.caregiverName);
              showToast("Bilhete de carinho enviado com sucesso");
            }}
          />
        )}

        {showConnectModal && (
          <FamilyConnectModal
            isOpen={showConnectModal}
            onClose={() => setShowConnectModal(false)}
            onSuccessPair={(patientName, relation) => {
              setHasRealBinding(true);
              setDashboard((prev) => ({
                ...prev,
                patientName,
                caregiverRelation: relation,
                lastMeasurementLabel: "Novo familiar conectado",
              }));
              showToast(`Conectado com sucesso a ${patientName}!`);
            }}
          />
        )}

        {showPhoneLinkDialog && (
          <PhoneLinkDialog
            isOpen={showPhoneLinkDialog}
            onClose={() => setShowPhoneLinkDialog(false)}
            initialPhone={userPhone || ""}
            onSuccess={(phone) => {
              setUserPhone(phone);
              if (currentUser) {
                localStorage.setItem(`braga_phone_${currentUser.uid}`, phone);
              }
              showToast("WhatsApp vinculado com sucesso!");
            }}
          />
        )}
      </React.Suspense>
    </div>
  );
};

export default App;
