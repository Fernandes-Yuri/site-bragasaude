import React, { useState, useEffect } from "react";
import { PhoneCall, CheckCircle2, AlertCircle, MessageSquare, UserPlus, Home, MessageCircle, User as UserIcon } from "lucide-react";
import {
  auth,
  signOut,
  onAuthStateChanged,
  type User,
} from "./services/firebase";
import {
  EMPTY_CAREGIVER_STATE,
  EMPTY_GROCERY_ITEMS,
  EMPTY_HISTORY_7D,
  QUICK_TEMPLATES,
  fetchFamilyBindings,
  fetchPatientVitals,
  syncCaregiverPhone,
} from "./services/api";
import { loadGroceryItems, toggleGroceryItemPantry } from "./services/grocery";
import { queueMessage, flushMessageQueue } from "./services/messageQueue";
import type { CaregiverDashboardState, GroceryItem, VitalHistoryRecord, FamilyBinding } from "./types";
import { EmeraldHeaderBanner } from "./components/EmeraldHeaderBanner";
import { PatientHeaderCard } from "./components/PatientHeaderCard";
import { TodayVitalsCard } from "./components/TodayVitalsCard";
import { QuickActionsChips } from "./components/QuickActionsChips";
import { SharedGroceryListCard } from "./components/SharedGroceryListCard";
import { QuickMessagesCard } from "./components/QuickMessagesCard";
import { ProfileScreen } from "./components/ProfileScreen";
import { FamilyChatScreen } from "./components/FamilyChatScreen";
import { VoiceAssistant } from "./components/VoiceAssistant";

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
const InstallPromptBanner = React.lazy(() =>
  import("./components/InstallPromptBanner").then((m) => ({ default: m.InstallPromptBanner }))
);

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [dashboard, setDashboard] = useState<CaregiverDashboardState>(EMPTY_CAREGIVER_STATE);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(EMPTY_GROCERY_ITEMS);
  const [historyRecords, setHistoryRecords] = useState<VitalHistoryRecord[]>(EMPTY_HISTORY_7D);
  const [hasRealBinding, setHasRealBinding] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [bindings, setBindings] = useState<FamilyBinding[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "profile">("home");
  const [idToken, setIdToken] = useState<string | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Estados dos modais de diálogo
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showCareNoteDialog, setShowCareNoteDialog] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPhoneLinkDialog, setShowPhoneLinkDialog] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
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
          const token = await user.getIdToken();
          setIdToken(token);
          const bindings = await fetchFamilyBindings(user.uid, token);
          setBindings(bindings);
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
            const vitals = await fetchPatientVitals(active.patientUserId, token);
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
          console.warn("Erro ao sincronizar dados iniciais:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Carregar lista de compras persistida localmente (offline-first)
  useEffect(() => {
    loadGroceryItems().then((items) => {
      if (items.length > 0) setGroceryItems(items);
    });
  }, []);

  // Processar fila de mensagens quando a conexao retornar
  useEffect(() => {
    const getToken = async () =>
      currentUser ? currentUser.getIdToken() : undefined;

    const handleOnline = async () => {
      const delivered = await flushMessageQueue(getToken);
      if (delivered > 0) {
        showToast(`${delivered} mensagem(ns) pendente(s) entregue(s) com sucesso`);
      }
    };

    window.addEventListener("online", handleOnline);

    // Processa pendencias existentes ao abrir (caso tenha voltado antes)
    flushMessageQueue(getToken);

    return () => window.removeEventListener("online", handleOnline);
  }, [currentUser]);

  const handleToggleGrocery = (id: string) => {
    setGroceryItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, isCheckedInPantry: !item.isCheckedInPantry } : item
      );
      // Persiste a alteracao localmente (offline-first)
      const item = updated.find((i) => i.id === id);
      if (item) toggleGroceryItemPantry(id, item.isCheckedInPantry);
      return updated;
    });
  };

  const handleSendMessage = async (
    text: string,
    iconType: "LOVE" | "MEDICATION" | "WATER" | "WALK" | "APPOINTMENT"
  ): Promise<boolean> => {
    if (!currentUser) return false;
    if (!dashboard.patientUserId) {
      showToast("Conecte um familiar antes de enviar mensagens.", "error");
      return false;
    }
    try {
      const tok = await currentUser.getIdToken();
      const now = new Date();
      const result = await queueMessage(
        {
          id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
          patientId: dashboard.patientUserId,
          senderId: currentUser.uid,
          senderName: dashboard.caregiverName,
          messageText: text,
          iconType,
          sentAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        tok
      );
      if (!result.delivered) {
        showToast("Sem conexão — mensagem salva e será enviada depois.", "error");
      }
      return result.delivered;
    } catch (err) {
      console.warn("Falha ao enviar mensagem:", err);
      showToast("Mensagem não entregue — verifique sua conexão.", "error");
      return false;
    }
  };

  const handleSendQuickTemplate = async (templateKey: string) => {
    const template = QUICK_TEMPLATES[templateKey];
    if (!template) return;

    const delivered = await handleSendMessage(
      template.text,
      template.iconType === "water"
        ? "WATER"
        : template.iconType === "medication"
        ? "MEDICATION"
        : template.iconType === "walk"
        ? "WALK"
        : "LOVE"
    );

    showToast(
      delivered
        ? `Mensagem enviada: "${template.label}"`
        : `Mensagem não entregue: "${template.label}"`,
      delivered ? "success" : "error"
    );
  };

  const handleRefresh = async () => {
    setDashboard((prev) => ({ ...prev, isLoading: true }));
    let succeeded = false;
    try {
      if (currentUser) {
        const idToken = await currentUser.getIdToken(true);
        const bindings = await fetchFamilyBindings(currentUser.uid, idToken);
        setBindings(bindings);
        if (bindings.length > 0) {
          const vitals = await fetchPatientVitals(bindings[0].patientUserId, idToken);
          if (vitals.length > 0) setHistoryRecords(vitals);
        }
        succeeded = true;
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => {
        setDashboard((prev) => ({
          ...prev,
          isLoading: false,
          lastMeasurementLabel: succeeded ? "Sincronizado agora" : null,
        }));
        showToast(
          succeeded
            ? "Dados atualizados com sucesso"
            : "Falha na sincronização — verifique sua conexão.",
          succeeded ? "success" : "error"
        );
      }, 500);
    }
  };

  const handleEmergencyCall = () => {
    window.location.href = "tel:192";
  };

  const handleLogout = async () => {
    await signOut(auth);
    // Zera todos os dados pessoais: em aparelho compartilhado, o proximo
    // usuario nao pode ver sinais vitais, lista de compras ou telefone
    // de quem saiu.
    setHasRealBinding(false);
    setDashboard(EMPTY_CAREGIVER_STATE);
    setGroceryItems(EMPTY_GROCERY_ITEMS);
    setHistoryRecords(EMPTY_HISTORY_7D);
    setUserPhone(null);
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
        <InstallPromptBanner />
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

      {/* Cabeçalho Curvo Esmeralda — enxuto (ações de conta ficam na aba Perfil) */}
      <EmeraldHeaderBanner
        title="Acompanhamento"
        subtitle={`Cuidador: ${dashboard.caregiverName}`}
        patientName={dashboard.patientName}
        onConnectFamily={() => setShowConnectModal(true)}
        onLinkWhatsApp={() => setShowPhoneLinkDialog(true)}
        onOpenProfile={() => setActiveTab("profile")}
      />

      {/* Indicador de sincronização sutil */}
      {dashboard.isLoading && (
        <div className="w-full h-1 bg-[#E0F2F1] overflow-hidden">
          <div className="w-full h-full bg-[#00897B] animate-pulse" />
        </div>
      )}

      {/* Conteúdo Principal — renderizado por aba */}
      {activeTab === "chat" ? (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <FamilyChatScreen
            patientId={dashboard.patientUserId}
            patientName={dashboard.patientName}
            currentUserId={currentUser.uid}
            caregiverName={dashboard.caregiverName}
            idToken={idToken}
            onToast={showToast}
          />
        </main>
      ) : activeTab === "profile" ? (
        <main className="p-4 space-y-4 flex-1 pb-24 overflow-y-auto">
          <ProfileScreen
            caregiverName={dashboard.caregiverName}
            email={currentUser.email || "—"}
            phone={userPhone || ""}
            patientName={dashboard.patientName}
            bindings={bindings}
            isRefreshing={dashboard.isLoading}
            onRefresh={handleRefresh}
            onLinkWhatsApp={() => setShowPhoneLinkDialog(true)}
            onConnectFamily={() => setShowConnectModal(true)}
            onLogout={handleLogout}
          />
        </main>
      ) : (
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

        {/* Disclaimer Clínico Institucional */}
        <div className="pt-2 pb-6 text-center">
          <p className="text-[10px] text-[#94A3B8] leading-tight max-w-xs mx-auto">
            O Braga Saúde é uma plataforma de suporte ao autocuidado e acompanhamento familiar preventivo, não substituindo consultas, diagnósticos ou prescrições médicas.
          </p>
        </div>
      </main>
      )}

      {/* Copiloto de voz — disponível na aba Início (escopo: cuidador) */}
      {activeTab === "home" && (
        <VoiceAssistant
          userId={currentUser.uid}
          idToken={idToken}
          patientName={dashboard.patientName}
          actingAs="caregiver"
          patientId={dashboard.patientUserId}
          onToast={showToast}
        />
      )}

      {/* Navegação Inferior por Abas (safe area iOS) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#E5EBE8] pb-safe pt-1.5 px-2 flex items-center justify-around z-40">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-95 ${
            activeTab === "home" ? "text-[#00897B]" : "text-[#94A3B8]"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Início</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-95 ${
            activeTab === "chat" ? "text-[#00897B]" : "text-[#94A3B8]"
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold">Família</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-95 ${
            activeTab === "profile" ? "text-[#00897B]" : "text-[#94A3B8]"
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold">Perfil</span>
        </button>
      </nav>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl flex items-center gap-2 border animate-in fade-in slide-in-from-top-4 ${
            toastType === "error"
              ? "bg-[#7F1D1D] border-[#D9532F]/50"
              : "bg-[#1E293B] border-white/10"
          }`}
        >
          {toastType === "error" ? (
            <AlertCircle className="w-4 h-4 text-[#FCA5A5]" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#26A69A]" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Diálogos Modais (Lazy Loaded Sob Demanda) */}
      <React.Suspense fallback={null}>
        {showMedicationDialog && (
          <MedicationReminderDialog
            isOpen={showMedicationDialog}
            onClose={() => setShowMedicationDialog(false)}
            onSend={async (text) => {
              const ok = await handleSendMessage(text, "MEDICATION");
              showToast(
                ok
                  ? "Lembrete de medicação enviado para o familiar"
                  : "Lembrete não entregue — verifique sua conexão.",
                ok ? "success" : "error"
              );
            }}
          />
        )}

        {showAppointmentDialog && (
          <AppointmentDialog
            isOpen={showAppointmentDialog}
            onClose={() => setShowAppointmentDialog(false)}
            onSend={async (spec, date) => {
              const ok = await handleSendMessage(
                `Consulta agendada: ${spec} em ${date}`,
                "APPOINTMENT"
              );
              showToast(
                ok
                  ? "Consulta médica salva e notificada"
                  : "Consulta não entregue — verifique sua conexão.",
                ok ? "success" : "error"
              );
            }}
          />
        )}

        {showCareNoteDialog && (
          <CareNoteDialog
            isOpen={showCareNoteDialog}
            onClose={() => setShowCareNoteDialog(false)}
            onSend={async (text) => {
              const ok = await handleSendMessage(text, "LOVE");
              showToast(
                ok
                  ? "Bilhete de carinho enviado com sucesso"
                  : "Bilhete não entregue — verifique sua conexão.",
                ok ? "success" : "error"
              );
            }}
          />
        )}

        {showConnectModal && (
          <FamilyConnectModal
            isOpen={showConnectModal}
            onClose={() => setShowConnectModal(false)}
            defaultCaregiverName={dashboard.caregiverName}
            getIdToken={async () => (currentUser ? currentUser.getIdToken() : undefined)}
            onSuccessPair={(patientName, relation, patientUserId) => {
              setHasRealBinding(true);
              setDashboard((prev) => ({
                ...prev,
                patientName,
                patientUserId,
                caregiverRelation: relation,
                lastMeasurementLabel: "Novo familiar conectado",
              }));
              if (currentUser && patientUserId) {
                currentUser.getIdToken().then((tok: string) => {
                  fetchPatientVitals(patientUserId, tok).then((vitals) => {
                    if (vitals.length > 0) setHistoryRecords(vitals);
                  });
                });
              }
              showToast(`Conectado com sucesso a ${patientName}!`);
            }}
          />
        )}

        {showPhoneLinkDialog && (
          <PhoneLinkDialog
            isOpen={showPhoneLinkDialog}
            onClose={() => setShowPhoneLinkDialog(false)}
            initialPhone={userPhone || ""}
            onSuccess={async (phone) => {
              setUserPhone(phone);
              if (currentUser) {
                localStorage.setItem(`braga_phone_${currentUser.uid}`, phone);
                const tok = await currentUser.getIdToken();
                await syncCaregiverPhone(currentUser.uid, dashboard.caregiverName, phone, tok);
              }
              showToast("WhatsApp vinculado com sucesso!");
            }}
          />
        )}

        <InstallPromptBanner />
      </React.Suspense>
    </div>
  );
};

export default App;
