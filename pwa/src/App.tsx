import { familyGroups, resolveFamilyGroup } from './services/familyGroups';
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PhoneCall, CheckCircle2, AlertCircle, MessageSquare, UserPlus, Home, MessageCircle, User as UserIcon, FileText } from "lucide-react";
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
  readTotpSecret,
  clearTotpSecret,
  fetchMedicationStock,
  fetchActivityFeed,
  fetchDailyBulletin,
  fetchClinicalCorrelations,
  revokeFamilyBinding,
} from "./services/api";
import { loadGroceryItems, persistGroceryItem, toggleGroceryItemPantry } from "./services/grocery";
import { queueMessage, flushMessageQueue, clearMessageQueue } from "./services/messageQueue";
import type { CaregiverDashboardState, GroceryItem, VitalHistoryRecord, FamilyBinding, MedicationStockItem, ActivityFeedItem, DailyBulletin, ClinicalCorrelation } from "./types";
import { EmeraldHeaderBanner } from "./components/EmeraldHeaderBanner";
import { PatientHeaderCard } from "./components/PatientHeaderCard";
import { TodayVitalsCard } from "./components/TodayVitalsCard";
import { QuickActionsChips } from "./components/QuickActionsChips";
import { SharedGroceryListCard } from "./components/SharedGroceryListCard";
import { QuickMessagesCard } from "./components/QuickMessagesCard";
import { ProfileScreen } from "./components/ProfileScreen";
import { FamilyChatScreen } from "./components/FamilyChatScreen";
import { FamilyInboxList } from "./components/FamilyInboxList";
import { FamilyMemberProfileModal } from "./components/FamilyMemberProfileModal";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { MedicationStockSection } from "./components/MedicationStockSection";
import { DailyBulletinCard } from "./components/DailyBulletinCard";
import { ActivityFeedTimeline } from "./components/ActivityFeedTimeline";
import { ClinicalCorrelationsAlert } from "./components/ClinicalCorrelationsAlert";
import { DoctorReportModal } from "./components/DoctorReportModal";

// Code-Splitting: componentes pesados carregados sob demanda
const LoginScreen = React.lazy(() =>
  import("./components/LoginScreen").then((m) => ({ default: m.LoginScreen }))
);
// AUD-PW(B): DesktopGateModal é artifact de dev — só carrega em localhost.
// Em produção (braga-saude.web.app), retorna null e evita o chunk desnecessário.
const isDevHost = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1" ||
   window.location.hostname === "::1");
const DesktopGateModal = isDevHost
  ? React.lazy(() =>
      import("./components/DesktopGateModal").then((m) => ({ default: m.DesktopGateModal }))
    )
  : (() => Promise.resolve({ default: () => null })) as unknown as React.LazyExoticComponent<React.FC<{onBypassDev?: () => void}>>;
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
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showInboxList, setShowInboxList] = useState(false);
  const [inspectingBinding, setInspectingBinding] = useState<FamilyBinding | null>(null);
  const groups = useMemo(() => familyGroups(bindings, currentUser?.uid || ''), [bindings, currentUser?.uid]);
  const chatPatientId = resolveFamilyGroup(bindings, currentUser?.uid || '', selectedGroup);
  const getChatToken = useCallback(async () => currentUser?.getIdToken(), [currentUser]);
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "profile">("home");
  // AUD-PW03: removido o estado idToken — era uma snapshot stale. Consumidores
  // agora recebem um getter que resolve o token fresco no instante da chamada.

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  // AUD-PW(B): timer do toast — ver showToast.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const careOsRequest = useRef(0);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    // AUD-PW(B): 3500ms era curto demais — dois toasts consecutivos
    // faziam o primeiro desaparecer antes de o usuário ler. Agora 5000ms
    // garante leitura adequada mesmo com toasts encadeados.
    toastTimer.current = setTimeout(() => setToastMessage(null), 5000);
  }, []);

  const handleRevokeBinding = useCallback(async (binding: FamilyBinding) => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const ok = await revokeFamilyBinding(binding, token);
      if (ok) {
        showToast(`Vínculo com ${binding.patientName || binding.caregiverName || "familiar"} revogado com sucesso`);
        const freshBindings = await fetchFamilyBindings(currentUser.uid, token);
        setBindings(freshBindings);
        const remaining = familyGroups(freshBindings, currentUser.uid);
        if (binding.patientUserId === chatPatientId) {
          if (remaining.length > 0) {
            setSelectedGroup(remaining[0].patientUserId);
          } else {
            setSelectedGroup(null);
            setDashboard(EMPTY_CAREGIVER_STATE);
            setHistoryRecords([]);
          }
        }
        setInspectingBinding(null);
      } else {
        showToast("Não foi possível revogar o vínculo. Verifique sua conexão.", "error");
      }
    } catch (err) {
      console.warn("Erro ao revogar vínculo:", err);
      showToast("Erro ao revogar o vínculo", "error");
    }
  }, [currentUser, chatPatientId, showToast]);

  // Estados dos modais de diálogo
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showCareNoteDialog, setShowCareNoteDialog] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPhoneLinkDialog, setShowPhoneLinkDialog] = useState(false);
  const [showDoctorReport, setShowDoctorReport] = useState(false);
  const [medicationStock, setMedicationStock] = useState<MedicationStockItem[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [dailyBulletin, setDailyBulletin] = useState<DailyBulletin | null>(null);
  const [clinicalCorrelations, setClinicalCorrelations] = useState<ClinicalCorrelation[]>([]);
  const [careOsLoading, setCareOsLoading] = useState(false);

  // Monitorar autenticação do Firebase em tempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setBindings([]);
      setSelectedGroup(null);
      setDashboard(EMPTY_CAREGIVER_STATE);
      setHistoryRecords([]);
      setHasRealBinding(false);
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
          const bindings = await fetchFamilyBindings(user.uid, token);
          setBindings(bindings);

        } catch (err) {
          console.warn("Erro ao sincronizar dados iniciais:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const caregiverName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Cuidador';
    setHistoryRecords([]);
    setHasRealBinding(Boolean(chatPatientId));
    setDashboard({ ...EMPTY_CAREGIVER_STATE, caregiverName, patientUserId: chatPatientId,
      patientName: chatPatientId === currentUser?.uid ? 'Minha família' :
        (groups.find(b => b.patientUserId === chatPatientId)?.patientName || 'Familiar conectado'),
      hasActiveBinding: Boolean(chatPatientId), isLoading: Boolean(chatPatientId) });
    if (chatPatientId && currentUser) {
      currentUser.getIdToken().then(token => fetchPatientVitals(chatPatientId, token)).then(vitals => {
        if (cancelled) return;
        setHistoryRecords(vitals);
        const latest = vitals[0];
        setDashboard(prev => ({ ...prev, isLoading: false,
          systolic: latest?.systolic ?? null, diastolic: latest?.diastolic ?? null,
          glucose: latest?.glucose ?? null, hydrationMl: latest?.hydrationMl ?? 0,
          steps: latest?.steps ?? 0 }));
      }).catch(() => { if (!cancelled) setDashboard(prev => ({ ...prev, isLoading: false })); });
    }
    return () => { cancelled = true; };
  }, [chatPatientId, currentUser, groups]);

  const refreshCareOs = useCallback(async (showLoading = false, reset = false) => {
    await Promise.resolve();
    const requestId = ++careOsRequest.current;
    if (!chatPatientId || !currentUser) {
      setMedicationStock([]);
      setActivityFeed([]);
      setDailyBulletin(null);
      setClinicalCorrelations([]);
      setCareOsLoading(false);
      return;
    }
    if (showLoading) setCareOsLoading(true);
    if (reset) {
      setMedicationStock([]);
      setActivityFeed([]);
      setDailyBulletin(null);
      setClinicalCorrelations([]);
    }
    try {
      const token = await currentUser.getIdToken();
      const [stock, feed, bulletin, correlations] = await Promise.allSettled([
        fetchMedicationStock(chatPatientId, token),
        fetchActivityFeed(chatPatientId, 50, token),
        fetchDailyBulletin(chatPatientId, undefined, token),
        fetchClinicalCorrelations(chatPatientId, token),
      ]);
      if (requestId !== careOsRequest.current) return;
      if (stock.status === "fulfilled") setMedicationStock(stock.value);
      if (feed.status === "fulfilled") setActivityFeed(feed.value);
      if (bulletin.status === "fulfilled") setDailyBulletin(bulletin.value);
      if (correlations.status === "fulfilled") setClinicalCorrelations(correlations.value);
      const failures = [stock, feed, bulletin, correlations].filter((result) => result.status === "rejected");
      if (failures.length) console.warn(`${failures.length} área(s) do Care OS não puderam ser atualizadas.`);
    } catch (error) {
      console.warn("Care OS indisponível:", error);
    } finally {
      if (requestId === careOsRequest.current) setCareOsLoading(false);
    }
  }, [chatPatientId, currentUser]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refreshCareOs(true, true), 0);
    if (!chatPatientId || !currentUser) return () => window.clearTimeout(initialRefresh);
    const interval = window.setInterval(() => void refreshCareOs(false), 30_000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [chatPatientId, currentUser, refreshCareOs]);

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
  }, [currentUser, showToast]);

  // Segredo TOTP do vinculo de WhatsApp: vem do backend (que agora garante um
  // para toda conta) e e cacheado no localStorage. Antes era gerado so no
  // syncCaregiverPhone, deixando contas existentes sem segredo nenhum.
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  useEffect(() => {
    if (!currentUser) {
      setTotpSecret(null);
      return;
    }
    let cancelado = false;
    (async () => {
      const tok = await currentUser.getIdToken().catch(() => undefined);
      const seg = await readTotpSecret(currentUser.uid, tok);
      if (!cancelado) setTotpSecret(seg);
    })();
    return () => { cancelado = true; };
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

  const handleAddMedicationToShoppingList = (medication: MedicationStockItem) => {
    const itemId = `med-${medication.id}`;
    if (groceryItems.some((item) => item.id === itemId)) {
      showToast(`${medication.name} já está na lista de compras.`);
      return;
    }
    const item: GroceryItem = {
      id: itemId,
      foodName: medication.name,
      purchaseUnitText: "1 embalagem",
      category: "Farmácia",
      isCheckedInPantry: false,
    };
    setGroceryItems((current) => [...current, item]);
    void persistGroceryItem(item);
    showToast(`${medication.name} adicionado à lista de compras.`);
  };

  const handleSendMessage = async (
    text: string,
    iconType: "LOVE" | "MEDICATION" | "WATER" | "WALK" | "APPOINTMENT"
  ): Promise<boolean> => {
    if (!currentUser) return false;
    if (!chatPatientId || dashboard.patientUserId !== chatPatientId) {
      showToast("Selecione uma família antes de enviar mensagens.", "error");
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
        await refreshCareOs(false);
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
    const uid = currentUser?.uid;
    await signOut(auth);
    // Zera todos os dados pessoais: em aparelho compartilhado, o proximo
    // usuario nao pode ver sinais vitais, lista de compras ou telefone
    // de quem saiu.
    // AUD-PW01: o segredo TOTP do vinculo de WhatsApp tambem precisa sair do
    // localStorage — senao quem entra depois pode vincular o WhatsApp da
    // conta antiga a outro numero.
    if (uid) clearTotpSecret(uid);
    try {
      localStorage.removeItem(`braga_phone_${uid}`);
    } catch {
      // sem localStorage: nada a limpar
    }
    // AUD-PW02: a fila de mensagens no IndexedDB continua textos familiares de
    // quem saiu — limpa junto, senão o próximo usuário de aparelho compartilhado
    // lê (e a fila tenta entregar com o token novo = mensagem cruzada).
    clearMessageQueue().catch(() => {});
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

      {activeTab === "home" && groups.length > 1 && (
        <div className="px-4 py-3">
          <label htmlFor="family-group" className="block text-sm font-semibold mb-2">Grupo da família</label>
          <select id="family-group" value={chatPatientId} onChange={event => setSelectedGroup(event.target.value)}
            className="w-full min-h-12 rounded-xl border border-[#B2DFDB] bg-white px-3 text-base">
            <option value="">Selecione a família</option>
            {groups.map((group, index) => <option key={group.patientUserId} value={group.patientUserId}>
              {group.patientUserId === currentUser.uid ? 'Minha família' : group.patientName || `Familiar ${index + 1}`}
            </option>)}
          </select>
        </div>
      )}
      {/* Indicador de sincronização sutil */}
      {dashboard.isLoading && (
        <div className="w-full h-1 bg-[#E0F2F1] overflow-hidden">
          <div className="w-full h-full bg-[#00897B] animate-pulse" />
        </div>
      )}

      {/* Conteúdo Principal — renderizado por aba */}
      {activeTab === "chat" ? (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {groups.length > 1 && (showInboxList || !chatPatientId) ? (
            <FamilyInboxList
              groups={groups}
              currentUserId={currentUser.uid}
              onSelectGroup={(pid) => {
                setSelectedGroup(pid);
                setShowInboxList(false);
              }}
              onOpenProfile={(b) => setInspectingBinding(b)}
              onConnectFamily={() => setShowConnectModal(true)}
            />
          ) : (
            <FamilyChatScreen
              key={`${currentUser.uid}:${chatPatientId}`}
              patientId={chatPatientId}
              patientName={dashboard.patientName}
              currentUserId={currentUser.uid}
              caregiverName={dashboard.caregiverName}
              getIdToken={getChatToken}
              onToast={showToast}
              onBackToInbox={groups.length > 1 ? () => setShowInboxList(true) : undefined}
              onOpenProfile={() => {
                const b = bindings.find((x) => x.patientUserId === chatPatientId) || groups.find((x) => x.patientUserId === chatPatientId);
                if (b) setInspectingBinding(b);
              }}
            />
          )}
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
            totpSecret={totpSecret}
            whatsappLinkedPhone={userPhone}
            onOpenMemberProfile={(b) => setInspectingBinding(b)}
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
                <p className="text-[12px] text-[#64748B] truncate">
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
                <p className="text-[12px] text-[#64748B]">
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

        <MedicationStockSection
          mode="alert"
          items={medicationStock}
          patientId={dashboard.patientUserId}
          patientName={dashboard.patientName}
          getIdToken={getChatToken}
          onAddToShoppingList={handleAddMedicationToShoppingList}
          onMedicationCreated={() => void refreshCareOs(true)}
          onToast={showToast}
        />

        <DailyBulletinCard
          bulletin={dailyBulletin}
          patientName={dashboard.patientName}
          isLoading={careOsLoading}
          onToast={showToast}
        />

        <ClinicalCorrelationsAlert correlations={clinicalCorrelations} />

        {/* Card de Sinais Vitais de Hoje */}
        <TodayVitalsCard state={dashboard} />

        <MedicationStockSection
          items={medicationStock}
          patientId={dashboard.patientUserId}
          patientName={dashboard.patientName}
          getIdToken={getChatToken}
          onAddToShoppingList={handleAddMedicationToShoppingList}
          onMedicationCreated={() => void refreshCareOs(true)}
          onToast={showToast}
        />

        <ActivityFeedTimeline items={activityFeed} />

        {dashboard.patientUserId && <button
          onClick={() => setShowDoctorReport(true)}
          className="w-full rounded-2xl bg-[#004D40] p-4 text-white flex items-center gap-3 text-left shadow-sm"
        >
          <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </span>
          <span>
            <strong className="block text-sm">Leva pro Doutor</strong>
            <span className="text-xs text-white/75">PDF de 30 dias ou QR Code temporário</span>
          </span>
        </button>}

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
          <p className="text-[12px] text-[#64748B] leading-tight max-w-xs mx-auto">
            O Braga Saúde é uma plataforma de suporte ao autocuidado e acompanhamento familiar preventivo, não substituindo consultas, diagnósticos ou prescrições médicas.
          </p>
        </div>
      </main>
      )}

      {/* Copiloto de voz — disponível na aba Início (escopo: cuidador) */}
      {activeTab === "home" && (
        <VoiceAssistant
          userId={currentUser.uid}
          // AUD-PW03: getter no lugar da string — token sempre fresco.
          getIdToken={async () =>
            currentUser ? currentUser.getIdToken() : undefined
          }
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
            activeTab === "home" ? "text-[#00897B]" : "text-[#64748B]"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[12px] font-bold">Início</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-95 ${
            activeTab === "chat" ? "text-[#00897B]" : "text-[#64748B]"
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[12px] font-bold">Família</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-95 ${
            activeTab === "profile" ? "text-[#00897B]" : "text-[#64748B]"
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[12px] font-bold">Perfil</span>
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
              setSelectedGroup(patientUserId);
              if (currentUser) currentUser.getIdToken().then(token => fetchFamilyBindings(currentUser.uid, token))
                .then(setBindings).catch(() => showToast('Atualize os vínculos para abrir o grupo.', 'error'));
              setHasRealBinding(true);
              setDashboard((prev) => ({
                ...prev,
                patientName,
                patientUserId,
                caregiverRelation: relation,
                lastMeasurementLabel: "Novo familiar conectado",
              }));
              if (currentUser && patientUserId) {
                // AUD-PW(B): as duas .then() em cadeia não tinham .catch() —
                // offline (pareamento offline via QR), a rejection virava
                // "Unhandled promise rejection" no console e a UI ficava
                // girando. Agora falha silenciosamente: os vitais serão
                // puxados no próximo sync.
                currentUser
                  .getIdToken()
                  .then((tok: string) =>
                    fetchPatientVitals(patientUserId, tok).then((vitals) => {
                      if (vitals.length > 0) setHistoryRecords(vitals);
                    })
                  )
                  .catch((e) => console.warn("Vitais do novo vínculo pendentes:", e));
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

        <DoctorReportModal
          isOpen={showDoctorReport}
          patientId={dashboard.patientUserId}
          patientName={dashboard.patientName}
          getIdToken={getChatToken}
          onClose={() => setShowDoctorReport(false)}
          onToast={showToast}
        />

        <FamilyMemberProfileModal
          isOpen={Boolean(inspectingBinding)}
          onClose={() => setInspectingBinding(null)}
          binding={inspectingBinding}
          currentUserId={currentUser?.uid || ""}
          onRevoke={handleRevokeBinding}
          onGoToDashboard={() => {
            if (inspectingBinding) {
              setSelectedGroup(inspectingBinding.patientUserId);
              setActiveTab("home");
            }
          }}
        />

        <InstallPromptBanner />
      </React.Suspense>
    </div>
  );
};

export default App;
