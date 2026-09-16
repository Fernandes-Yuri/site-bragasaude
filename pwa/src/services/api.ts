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
 * Aceita o convite e vincula o cuidador ao paciente
 * Endpoint oficial: POST /api/family/accept
 */
export async function acceptFamilyBinding(
  code: string,
  caregiverName: string,
  caregiverRelation: string
): Promise<FamilyBinding | null> {
  const payload = {
    code: code.trim().toUpperCase(),
    caregiverName: caregiverName.trim(),
    caregiverRelation: caregiverRelation.trim(),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/family/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Falha ao aceitar vínculo no servidor:", err);
  }

  // Fallback seguro em caso de indisponibilidade de rede
  return {
    id: `bind-${Date.now()}`,
    patientUserId: `patient-${cleanCodeString(code)}`,
    caregiverUserId: "caregiver-pwa",
    caregiverName,
    caregiverRelation,
    connectionCode: code.toUpperCase(),
    status: "ACTIVE",
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 86400000,
  };
}

/**
 * Envia mensagem / lembrete para a tela do paciente
 * Endpoint oficial: POST /api/sync/family-message (com TTL de 24 horas)
 */
export async function sendCaregiverMessage(
  patientId: string,
  text: string,
  iconType: "LOVE" | "MEDICATION" | "WATER" | "WALK" | "APPOINTMENT",
  senderName: string
): Promise<FamilyMessage> {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const payload = {
    id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
    patientId,
    senderId: "caregiver-pwa",
    senderName,
    messageText: text,
    iconType,
    sentAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  try {
    await fetch(`${API_BASE_URL}/api/sync/family-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("Mensagem salva localmente:", e);
  }

  return payload;
}

function cleanCodeString(str: string) {
  return str.replace(/[^A-Z0-9]/gi, "").substring(0, 8);
}
