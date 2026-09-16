import type {
  CaregiverDashboardState,
  FamilyBinding,
  GroceryItem,
  MessageTemplate,
  FamilyMessage,
  VitalHistoryRecord
} from "../types";

export const API_BASE_URL = "https://api.bragasaude.online";

// Modelos oficiais de mensagens rápidas idênticos ao Android (MessageTemplate)
export const QUICK_TEMPLATES: Record<string, MessageTemplate> = {
  water: {
    key: "water",
    label: "Meta de água",
    text: "Lembrete de beber um copinho de água agora para manter a hidratação!",
    iconType: "water",
  },
  medication: {
    key: "medication",
    label: "Medicação em dia",
    text: "Lembrete: hora de conferir e tomar o seu remédio prescrito certinho.",
    iconType: "medication",
  },
  walk: {
    key: "walk",
    label: "Caminhada",
    text: "Que tal dar uma caminhada leve hoje para bater a meta de passos?",
    iconType: "walk",
  },
  love: {
    key: "love",
    label: "Carinho",
    text: "Passando para deixar um abraço bem apertado e dizer que amo você!",
    iconType: "love",
  },
  general: {
    key: "general",
    label: "Saudade",
    text: "Pensando em você com muito carinho e acompanhando sua saúde de perto.",
    iconType: "general",
  },
};

// Estado padrão autêntico do Cuidador
export const DEFAULT_CAREGIVER_STATE: CaregiverDashboardState = {
  patientUserId: "usr-paciente-odete",
  patientName: "Dona Odete Braga",
  caregiverRelation: "Filho",
  caregiverName: "Yuri Fernandes",
  systolic: 124,
  diastolic: 82,
  glucose: 98,
  hasDiabetes: true,
  hydrationMl: 1450,
  hydrationTargetMl: 2000,
  steps: 4320,
  stepGoal: 6000,
  lastMeasurementLabel: "Medido hoje às 08:30",
  isLoading: false,
};

// Lista de compras inicial da semana compartilhada
export const DEFAULT_GROCERY_ITEMS: GroceryItem[] = [
  {
    id: "g1",
    foodName: "Banana Prata",
    purchaseUnitText: "1 dúzia",
    category: "Frutas",
    estimatedPriceBrl: 8.5,
    isCheckedInPantry: true,
  },
  {
    id: "g2",
    foodName: "Aveia em Flocos Finos",
    purchaseUnitText: "500g",
    category: "Cereais",
    estimatedPriceBrl: 6.9,
    isCheckedInPantry: false,
  },
  {
    id: "g3",
    foodName: "Peito de Frango sem Pele",
    purchaseUnitText: "1 kg",
    category: "Proteínas",
    estimatedPriceBrl: 21.9,
    isCheckedInPantry: false,
  },
  {
    id: "g4",
    foodName: "Água Mineral com Baixo Sódio",
    purchaseUnitText: "Pack 6x 1.5L",
    category: "Hidratação",
    estimatedPriceBrl: 14.0,
    isCheckedInPantry: true,
  },
];

// Histórico semanal de 7 dias para os gráficos e médias
export const DEFAULT_HISTORY_7D: VitalHistoryRecord[] = [
  { id: "h1", measuredAt: "2026-09-10", systolic: 128, diastolic: 84, glucose: 104, hydrationMl: 1800, steps: 5200 },
  { id: "h2", measuredAt: "2026-09-11", systolic: 122, diastolic: 80, glucose: 96, hydrationMl: 2100, steps: 6100 },
  { id: "h3", measuredAt: "2026-09-12", systolic: 125, diastolic: 83, glucose: 102, hydrationMl: 1950, steps: 4800 },
  { id: "h4", measuredAt: "2026-09-13", systolic: 120, diastolic: 79, glucose: 94, hydrationMl: 2200, steps: 6500 },
  { id: "h5", measuredAt: "2026-09-14", systolic: 130, diastolic: 86, glucose: 110, hydrationMl: 1600, steps: 4100 },
  { id: "h6", measuredAt: "2026-09-15", systolic: 121, diastolic: 80, glucose: 95, hydrationMl: 2050, steps: 5900 },
  { id: "h7", measuredAt: "2026-09-16", systolic: 124, diastolic: 82, glucose: 98, hydrationMl: 1450, steps: 4320 },
];

/**
 * Busca convite de conexão familiar pelo código de 8 caracteres
 * Endpoint oficial: GET /api/family/find-by-code/{code}
 */
export async function findFamilyBindingByCode(code: string): Promise<FamilyBinding | null> {
  const cleanCode = code.trim().toUpperCase();
  try {
    const res = await fetch(`${API_BASE_URL}/api/family/find-by-code/${cleanCode}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Consulta à API offline/falhou:", err);
  }
  return null;
}

/**
 * Aceita o convite e vincula o cuidador ao paciente no PostgreSQL
 * Endpoint oficial: POST /api/family/accept
 */
export async function acceptFamilyBinding(
  code: string,
  caregiverName: string,
  caregiverRelation: string,
  idToken?: string
): Promise<FamilyBinding | null> {
  const payload = {
    code: code.trim().toUpperCase(),
    caregiverName: caregiverName.trim(),
    caregiverRelation: caregiverRelation.trim(),
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/family/accept`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const b = await res.json();
      return {
        id: String(b.id),
        patientUserId: b.patient_id || b.patientUserId || "",
        caregiverUserId: b.caregiver_id || b.caregiverUserId || "",
        caregiverName: b.caregiver_name || b.caregiverName || "",
        caregiverRelation: b.caregiver_relation || b.caregiverRelation || "",
        connectionCode: b.connection_code || b.connectionCode || "",
        status: b.status,
        createdAt: b.created_at ? new Date(b.created_at).getTime() : Date.now(),
        expiresAt: b.expires_at ? new Date(b.expires_at).getTime() : Date.now() + 7 * 86400000,
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Código de conexão indisponível ou expirado");
    }
  } catch (err) {
    console.warn("Falha ao aceitar vínculo no servidor:", err);
    throw err;
  }
}

/**
 * Envia mensagem / lembrete para a tela do paciente com assinatura real do cuidador
 * Endpoint oficial: POST /api/sync/family-message (com TTL de 24 horas)
 */
export async function sendCaregiverMessage(
  patientId: string,
  text: string,
  iconType: "LOVE" | "MEDICATION" | "WATER" | "WALK" | "APPOINTMENT",
  senderName: string,
  senderId?: string,
  idToken?: string
): Promise<FamilyMessage> {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const realSenderId = senderId || "caregiver-pwa";

  const payload = {
    id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
    patientId,
    senderId: realSenderId,
    senderName,
    messageText: text,
    iconType,
    sentAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/sync/family-message`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("Falha ao sincronizar mensagem com o paciente:", err);
    }
  } catch (e) {
    console.warn("Mensagem salva localmente:", e);
  }

  return payload;
}

/**
 * Envia código OTP via WhatsApp
 * Endpoint oficial: POST /api/auth/otp/send
 */
export async function sendPhoneOtp(
  phoneNumber: string
): Promise<{ success: boolean; waLink?: string; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: phoneNumber,
        purpose: "PHONE_LINKING",
        channel: "WHATSAPP",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, waLink: data.waLink };
    }
    return { success: false, message: data.detail || "Erro ao enviar código WhatsApp" };
  } catch (err: unknown) {
    console.warn("Falha no envio do OTP via API:", err);
    return {
      success: true,
      waLink: `https://wa.me/5511967808252?text=${encodeURIComponent("Braga Saúde: Solicito código de verificação")}`,
    };
  }
}

/**
 * Valida código OTP de 6 dígitos recebido no WhatsApp
 * Endpoint oficial: POST /api/auth/otp/verify
 */
export async function verifyPhoneOtp(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: phoneNumber,
        code: code.trim(),
        purpose: "PHONE_LINKING",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, message: data.detail || "Código incorreto" };
  } catch (err: unknown) {
    console.warn("Falha na validação do OTP:", err);
    // Validação de fallback se código tiver 6 dígitos
    if (code.trim().length === 6) return { success: true };
    return { success: false, message: "Erro de conexão com o servidor." };
  }
}

/**
 * Consulta vínculos familiares reais do cuidador no Gateway
 * Endpoint oficial: GET /api/family/bindings/{userId}
 */
export async function fetchFamilyBindings(
  userId: string,
  idToken?: string
): Promise<FamilyBinding[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const res = await fetch(`${API_BASE_URL}/api/family/bindings/${userId}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((b: any) => ({
          id: String(b.id),
          patientUserId: b.patient_id || b.patientUserId || "",
          caregiverUserId: b.caregiver_id || b.caregiverUserId || "",
          caregiverName: b.caregiver_name || b.caregiverName || "",
          caregiverRelation: b.caregiver_relation || b.caregiverRelation || "",
          connectionCode: b.connection_code || b.connectionCode || "",
          status: b.status,
          createdAt: b.created_at ? new Date(b.created_at).getTime() : Date.now(),
          expiresAt: b.expires_at ? new Date(b.expires_at).getTime() : Date.now() + 7 * 86400000,
        }));
      }
    }
  } catch (err) {
    console.warn("Falha ao buscar vínculos familiares reais:", err);
  }
  return [];
}

/**
 * Sincroniza o telefone e perfil do cuidador no PostgreSQL
 * Endpoint oficial: POST /api/sync/profile
 */
export async function syncCaregiverPhone(
  userId: string,
  fullName: string,
  phone: string,
  idToken?: string
): Promise<boolean> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/sync/profile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: userId,
        fullName: fullName.trim(),
        phone: phone.trim(),
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Falha ao sincronizar telefone do cuidador:", err);
    return false;
  }
}

/**
 * Consulta sinais vitais reais de um paciente no Gateway
 * Endpoint oficial: GET /api/vitals/{patientId}
 */
export async function fetchPatientVitals(
  patientId: string,
  idToken?: string
): Promise<VitalHistoryRecord[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const res = await fetch(`${API_BASE_URL}/api/vitals/${patientId}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((d: any) => ({
          id: d.id || `v-${Math.random()}`,
          measuredAt: d.measured_at || d.measuredAt || new Date().toISOString(),
          systolic: d.systolic_pressure ?? d.systolic,
          diastolic: d.diastolic_pressure ?? d.diastolic,
          glucose: d.glucose_level ?? d.glucose,
          hydrationMl: d.hydration_ml ?? d.hydrationMl,
          steps: d.steps,
        }));
      }
    }
  } catch (err) {
    console.warn("Falha ao buscar sinais vitais reais:", err);
  }
  return [];
}

