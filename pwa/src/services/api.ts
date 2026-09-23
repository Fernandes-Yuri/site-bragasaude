import type {
  CaregiverDashboardState,
  FamilyBinding,
  GroceryItem,
  MessageTemplate,
  FamilyMessage,
  VitalHistoryRecord,
  MedicationStockItem,
  ActivityFeedItem,
  DailyBulletin,
  ClinicalCorrelation,
  MedicalAccessGrant,
  BarcodeMedication,
  MedicationCreateInput
} from "../types";
import { generateTotpSecret } from "./waLinkTotp";

export const API_BASE_URL = "https://api.bragasaude.online";

/**
 * Segredo TOTP do vinculo de WhatsApp por usuario. Fica no localStorage:
 * e um segredo por conta, gerado uma unica vez (regenerar invalidaria o
 * codigo de um cliente ja instalado). Arquitetura temporaria, sem template.
 */
function getOrCreateTotpSecret(userId: string): string {
  const KEY = `braga.totp_secret.${userId}`;
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const secret = generateTotpSecret();
    localStorage.setItem(KEY, secret);
    return secret;
  } catch {
    // localStorage indisponivel (modo privado etc.): gera novo a cada chamada.
    return generateTotpSecret();
  }
}

/**
 * Remove o segredo TOTP do localStorage — deve rodar no logout.
 *
 * AUD-PW01: o segredo do vinculo de WhatsApp era gravado e NUNCA removido. Em
 * aparelho compartilhado (o caso que este proprio codigo teme), quem entra
 * depois lê o segredo e vincula o WhatsApp da conta a outro numero.
 */
export function clearTotpSecret(userId: string): void {
  const KEY = `braga.totp_secret.${userId}`;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // localStorage indisponivel: nada a limpar.
  }
}

/**
 * Le o segredo TOTP do usuario.
 *
 * Ordem: localStorage (gerado uma unica vez por este dispositivo) e, se nao
 * existir, busca no backend — que agora garante que TODO perfil tem um
 * segredo (contas pre-009 recebem na primeira leitura do perfil). Se o
 * backend devolver um, guarda no localStorage para os proximos usos.
 *
 * Retorna null se nao houver jeito (off-line e sem cache local).
 */
export async function readTotpSecret(userId: string, idToken?: string): Promise<string | null> {
  const KEY = `braga.totp_secret.${userId}`;
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
  } catch {
    // localStorage indisponivel: segue para a busca no backend.
  }

  try {
    const headers: Record<string, string> = {};
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
    const res = await fetch(`${API_BASE_URL}/api/profile/${userId}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    const segredo = data?.totp_secret ?? data?.totpSecret ?? null;
    if (segredo) {
      try {
        localStorage.setItem(KEY, segredo);
      } catch {
        // Sem localStorage: funciona so para esta sessao.
      }
    }
    return segredo;
  } catch {
    return null;
  }
}

/**
 * Sincroniza o segredo TOTP local com o backend: se o backend ja tem um para
 * esta conta, e ele que vale (evita dois segredos divergentes); senao, envia
 * o gerado localmente. Retorna o segredo valido apos a sincronizacao.
 */
export async function syncTotpSecret(userId: string, idToken?: string): Promise<string | null> {
  const KEY = `braga.totp_secret.${userId}`;
  const local = (() => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  })();

  const remoto = await readTotpSecret(userId, idToken);
  if (remoto) {
    // O backend ja tem um segredo para esta conta: ele e a verdade.
    if (local !== remoto) {
      try { localStorage.setItem(KEY, remoto); } catch { /* sem storage */ }
    }
    return remoto;
  }

  // Nenhum dos lados tem: gera localmente e tenta registrar no backend.
  const novo = getOrCreateTotpSecret(userId);
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
    await fetch(`${API_BASE_URL}/api/sync/profile`, {
      method: "POST",
      headers,
      body: JSON.stringify({ id: userId, totpSecret: novo }),
    });
  } catch {
    // Sem rede: o segredo local ainda calcula um codigo, mas o vinculo
    // so se completa quando o backend o conhecer.
  }
  return novo;
}

/**
 * Confirma (pelo botao da tela) o rascunho de agendamento por voz (D51).
 * O gateway valida que o draftId pertence ao par cuidador/paciente.
 */
export async function confirmVoiceDraft(
  patientId: string,
  draftId: string,
  idToken?: string
): Promise<{ ok: boolean; fala?: string }> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const res = await fetch(`${API_BASE_URL}/api/consultation/confirm-voice-draft`, {
      method: "POST",
      headers,
      body: JSON.stringify({ patientId, draftId }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        fala: `Confirmado! Consulta com ${data.title} marcada. Já está na agenda.`,
      };
    }

    // 409 = rascunho expirado ou nao pertence a este usuario
    const data = await res.json().catch(() => ({}));
    return { ok: false, fala: data?.detail || "O agendamento expirou. Vamos refazer?" };
  } catch (err) {
    console.warn("Falha ao confirmar rascunho:", err);
    return { ok: false, fala: "Não consegui confirmar agora. Tente novamente." };
  }
}

/**
 * Sintetiza voz pelo Piper TTS do gateway — a MESMA voz do app Android
 * (padrão "faber", pt_BR-faber-medium.onnx). Retorna um Blob de áudio WAV.
 *
 * O navegador sozinho (SpeechSynthesis) usa as vozes do sistema, que variam
 * por aparelho e nao correspondem ao Braga. Aqui a voz e a identidade sonora
 * sao sempre as do produto, vindas do servidor.
 */
export async function synthesizePiperVoice(
  text: string,
  idToken: string,
  voice: string = "faber"
): Promise<Blob | null> {
  try {
    const clean = text.trim();
    if (!clean) return null;

    const url = new URL(`${API_BASE_URL}/v1/audio/speech`);
    url.searchParams.set("text", clean);
    url.searchParams.set("voice", voice);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
    });

    if (!res.ok) {
      console.warn("Piper TTS rejeitou:", res.status);
      return null;
    }

    return await res.blob();
  } catch (err) {
    console.warn("Falha no Piper TTS:", err);
    return null;
  }
}

/**
 * Copiloto de voz do cuidador.
 * Endpoint oficial: POST /v1/chat/completions (compatível com OpenAI)
 *
 * A resposta chega em choices[0].message.content como uma string JSON no
 * formato { fala, acao, parametros } — "fala" é o texto que o assistente
 * deve dizer em voz alta.
 */
export async function askVoiceCopilot(
  userText: string,
  userId: string,
  idToken?: string,
  scope?: { actingAs?: "patient" | "caregiver"; patientId?: string; patientName?: string }
): Promise<{ fala: string; acao: string; parametros?: Record<string, unknown> } | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const isCaregiver = scope?.actingAs === "caregiver" && scope.patientId;
    const systemPrompt = isCaregiver
      ? `Você é o Braga, assistente de saúde de um CUIDADOR familiar que acompanha ${scope.patientName || "o paciente"}. Responda em português do Brasil, de forma curta, acolhedora e prática, do ponto de vista de quem cuida: ajude a interpretar os sinais vitais, hidratação e medicação de ${scope.patientName || "o paciente"}, e a organizar o cuidado. O contexto atual é o MODO CUIDADOR (não confunda com as preferências pessoais do próprio cuidador). Nunca substitui orientação médica — em emergências, oriente a ligar para o SAMU (192).`
      : "Você é o Braga, assistente de saúde do autocuidado. Responda em português do Brasil, de forma curta, acolhedora e prática. Ajude com sinais vitais, hidratação e medicação. Nunca substitui orientação médica — em emergências, oriente a ligar para o SAMU (192).";

    const body: Record<string, any> = {
      model: "qwen-2.5-72b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      temperature: 0.3,
      max_tokens: 220,
      userId,
    };
    // Escopo de papel: o gateway valida o family_binding e separa a memória
    if (isCaregiver) {
      body.acting_as = "caregiver";
      body.patient_id = scope.patientId;
    }

    const res = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn("Copiloto rejeitou a requisição:", res.status);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    // O conteúdo vem como string JSON {fala, acao, parametros}
    try {
      const parsed = JSON.parse(content);
      if (parsed?.fala) {
        return {
          fala: String(parsed.fala),
          acao: String(parsed.acao || "CONVERSA"),
          parametros:
            parsed.parametros && typeof parsed.parametros === "object"
              ? parsed.parametros
              : undefined,
        };
      }
      // Se veio texto puro, usa direto
      return { fala: String(content), acao: "CONVERSA" };
    } catch {
      return { fala: String(content), acao: "CONVERSA" };
    }
  } catch (err) {
    console.warn("Falha ao consultar o copiloto:", err);
    return null;
  }
}

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

// Estado inicial neutro do Cuidador (sem dados mockados)
export const EMPTY_CAREGIVER_STATE: CaregiverDashboardState = {
  patientUserId: "",
  patientName: "",
  caregiverRelation: "Cuidador",
  caregiverName: "",
  systolic: null,
  diastolic: null,
  glucose: null,
  hasDiabetes: false,
  hydrationMl: 0,
  hydrationTargetMl: 2000,
  steps: 0,
  stepGoal: 6000,
  lastMeasurementLabel: null,
  isLoading: false,
};

export const EMPTY_GROCERY_ITEMS: GroceryItem[] = [];
export const EMPTY_HISTORY_7D: VitalHistoryRecord[] = [];

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
        patientName: b.patient_name || b.patientName || "",
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

export interface SendMessageResult {
  delivered: boolean;
  message: FamilyMessage;
}

/**
 * Envia mensagem / lembrete para a tela do paciente com assinatura real do cuidador
 * Endpoint oficial: POST /api/sync/family-message (com TTL de 24 horas)
 *
 * Retorna `delivered: false` sempre que o Gateway não confirmar a entrega.
 * O chamador DEVE avisar o usuário — nunca reportar sucesso sem confirmação.
 */
export async function sendCaregiverMessage(
  patientId: string,
  text: string,
  iconType: "LOVE" | "MEDICATION" | "WATER" | "WALK" | "APPOINTMENT",
  senderName: string,
  senderId?: string,
  idToken?: string
): Promise<SendMessageResult> {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const realSenderId = senderId || "caregiver-pwa";

  const payload: FamilyMessage = {
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
    if (res.ok) {
      return { delivered: true, message: payload };
    }
    const err = await res.json().catch(() => ({}));
    console.warn("Gateway rejeitou a mensagem:", err);
  } catch (e) {
    console.warn("Sem conexão — mensagem não entregue:", e);
  }

  return { delivered: false, message: payload };
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
    // Falha fechada: jamais afirmar que o código foi enviado sem confirmação
    // do Gateway. Caso contrário o usuário fica aguardando um código que
    // nunca chegará.
    return {
      success: false,
      message: "Não foi possível enviar o código agora. Verifique sua conexão e tente novamente.",
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
    return { success: false, message: "Erro de conexão com o servidor. Tente novamente." };
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
          patientName: b.patient_name || b.patientName || "",
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
 * Lista as mensagens da conversa em grupo do paciente.
 * Endpoint oficial: GET /api/family/messages/{patient_id}
 *
 * Todos os cuidadores vinculados ao mesmo patient_id compartilham a mesma
 * conversa (chat em grupo) — a autorização é validada no gateway por
 * require_family_access. TTL de 24h por mensagem (D47).
 */
export async function fetchFamilyMessages(
  patientId: string,
  idToken?: string,
  limit: number = 50
): Promise<FamilyMessage[]> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const res = await fetch(
      `${API_BASE_URL}/api/family/messages/${patientId}?limit=${limit}`,
      { headers }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.filter((m: any) => !m.deleted_at && !m.deletedAt &&
          new Date(m.expires_at || m.expiresAt).getTime() > Date.now()).map((m: any) => ({
          id: String(m.id),
          patientId: m.patient_id || m.patientId || patientId,
          senderId: m.sender_id || m.senderId || "",
          senderName: m.sender_name || m.senderName || "",
          messageText: m.message_text || m.messageText || "",
          iconType: m.icon_type || m.iconType || "LOVE",
          sentAt: m.sent_at || m.sentAt || new Date().toISOString(),
          expiresAt: m.expires_at || m.expiresAt || "",
        }));
      }
    }
    throw new Error('Não foi possível atualizar a conversa. Verifique sua conexão e o vínculo.');
}
export async function syncCaregiverPhone(
  userId: string,
  fullName: string,
  phone: string,
  idToken?: string
): Promise<boolean> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  try {
    // O segredo TOTP tem que ser o MESMO que o backend ja guarda para esta
    // conta; gerar um divergente aqui fazia o codigo nunca casar no webhook.
    const segredo = await syncTotpSecret(userId, idToken);
    const res = await fetch(`${API_BASE_URL}/api/sync/profile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: userId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        ...(segredo ? { totpSecret: segredo } : {}),
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

function careHeaders(idToken?: string, json = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  return headers;
}

async function requireOk(response: Response, fallbackMessage: string): Promise<Response> {
  if (response.ok) return response;
  const payload = await response.json().catch(() => ({}));
  throw new Error(payload?.detail || fallbackMessage);
}

export async function fetchMedicationStock(patientId: string, idToken?: string): Promise<MedicationStockItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/family/patients/${encodeURIComponent(patientId)}/medications/stock`, { headers: careHeaders(idToken) });
  await requireOk(response, "Não foi possível consultar o estoque de medicamentos.");
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item: any) => ({
    id: String(item.id), name: item.name || "Medicamento",
    activePrinciple: item.active_principle ?? item.activePrinciple ?? null,
    pharmaceuticalForm: item.pharmaceutical_form ?? item.pharmaceuticalForm ?? null,
    currentUnits: Number(item.current_units ?? item.currentUnits ?? 0),
    totalUnits: Number(item.total_units ?? item.totalUnits ?? 0),
    alertThresholdDays: Number(item.alert_threshold_days ?? item.alertThresholdDays ?? 5),
    daysRemaining: Number(item.days_remaining ?? item.daysRemaining ?? 0),
    isCritical: Boolean(item.is_critical ?? item.isCritical),
    photoReferenceUrl: item.photo_reference_url ?? item.photoReferenceUrl ?? null,
    prescriptionExpiresOn: item.prescription_expires_on ?? item.prescriptionExpiresOn ?? null,
  }));
}

export async function takeMedicationDose(medicationId: string, scheduledFor: string, idToken?: string): Promise<{ ok: boolean; status: number; message?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/medications/${encodeURIComponent(medicationId)}/take`, {
    method: "POST", headers: careHeaders(idToken, true),
    body: JSON.stringify({ scheduled_for: scheduledFor, units_taken: 1, idempotency_key: `${medicationId}_${scheduledFor}`.slice(0, 100) }),
  });
  if (response.status === 409) {
    const payload = await response.json().catch(() => ({}));
    const detail = String(payload?.detail || "");
    if (/confirmada|registrada|duplicad/i.test(detail)) {
      return { ok: true, status: 409, message: "Dose já confirmada anteriormente" };
    }
    throw new Error(detail || "Não foi possível confirmar a dose.");
  }
  await requireOk(response, "Não foi possível confirmar a dose.");
  return { ok: true, status: response.status };
}

export async function fetchActivityFeed(patientId: string, limit = 50, idToken?: string): Promise<ActivityFeedItem[]> {
  const safeLimit = Math.min(100, Math.max(1, limit));
  const response = await fetch(`${API_BASE_URL}/api/family/patients/${encodeURIComponent(patientId)}/activity-feed?limit=${safeLimit}`, { headers: careHeaders(idToken) });
  await requireOk(response, "Não foi possível atualizar a linha do tempo.");
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item: any) => ({
    id: String(item.id), actorId: item.actor_id ?? item.actorId ?? "",
    actorName: item.actor_name ?? item.actorName ?? "Familiar",
    actionType: item.action_type ?? item.actionType ?? "CARE_ACTION",
    details: item.details && typeof item.details === "object" ? item.details : {},
    occurredAt: item.occurred_at ?? item.occurredAt ?? new Date().toISOString(),
  }));
}

export async function fetchDailyBulletin(patientId: string, day?: string, idToken?: string): Promise<DailyBulletin | null> {
  const url = new URL(`${API_BASE_URL}/api/family/patients/${encodeURIComponent(patientId)}/daily-bulletin`);
  if (day) url.searchParams.set("day", day);
  const response = await fetch(url, { headers: careHeaders(idToken) });
  if (response.status === 404 || response.status === 204) return null;
  await requireOk(response, "Não foi possível carregar o boletim do dia.");
  const item = await response.json();
  const pressure = item.latest_blood_pressure ?? item.latestBloodPressure;
  const pressureParts = typeof pressure === "string" ? pressure.split("/").map(Number) : null;
  const normalizedPressure = pressureParts && pressureParts.length === 2 && pressureParts.every(Number.isFinite)
    ? { systolic: pressureParts[0], diastolic: pressureParts[1], measuredAt: "" }
    : pressure && typeof pressure === "object"
      ? {
          systolic: Number(pressure.systolic),
          diastolic: Number(pressure.diastolic),
          measuredAt: pressure.measured_at ?? pressure.measuredAt ?? "",
        }
      : null;
  return {
    patientId: item.patient_id ?? item.patientId ?? patientId, day: item.day,
    medicationsTaken: Number(item.medications_taken ?? item.medicationsTaken ?? 0),
    medicationsExpected: Number(item.medications_expected ?? item.medicationsExpected ?? 0),
    latestBloodPressure: normalizedPressure,
    hydrationMl: Number(item.hydration_ml ?? item.hydrationMl ?? 0),
    hydrationTargetMl: Number(item.hydration_target_ml ?? item.hydrationTargetMl ?? 2000),
    sleepQuality: item.sleep_quality ?? item.sleepQuality ?? null,
    disposition: item.disposition ?? null,
  };
}

export async function fetchClinicalCorrelations(patientId: string, idToken?: string): Promise<ClinicalCorrelation[]> {
  const response = await fetch(`${API_BASE_URL}/api/patients/${encodeURIComponent(patientId)}/clinical-correlations`, { headers: careHeaders(idToken) });
  await requireOk(response, "Não foi possível consultar as correlações clínicas.");
  const payload = await response.json();
  const data = Array.isArray(payload) ? payload : payload?.correlations;
  if (!Array.isArray(data)) return [];
  return data.map((item: any) => ({
    type: item.type ?? item.event_type ?? "CLINICAL_PATTERN",
    severity: item.severity ?? (item.event_type === "BLOOD_PRESSURE_PEAK" ? "HIGH" : "MEDIUM"),
    title: item.title ?? (item.event_type === "BLOOD_PRESSURE_PEAK" ? "Pico de pressão associado à rotina" : item.event_type === "GLUCOSE_PEAK" ? "Pico de glicemia associado à rotina" : "Padrão detectado"),
    description: item.description ?? [item.observation, ...(Array.isArray(item.evidence) ? item.evidence : [])].filter(Boolean).join(" "),
    observedAt: item.observed_at ?? item.observedAt ?? item.event_at ?? new Date().toISOString(),
  }));
}

export async function downloadDoctorReportPdf(patientId: string, days = 30, idToken?: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/family/patients/${encodeURIComponent(patientId)}/doctor-report/pdf?days=${days}`, { headers: careHeaders(idToken) });
  await requireOk(response, "Não foi possível gerar o relatório médico.");
  return response.blob();
}

export async function generateMedicalAccess(patientId: string, idToken?: string): Promise<MedicalAccessGrant> {
  const response = await fetch(`${API_BASE_URL}/api/patients/${encodeURIComponent(patientId)}/medical-access/generate`, {
    method: "POST", headers: careHeaders(idToken, true), body: JSON.stringify({ purpose: "CONSULTATION" }),
  });
  await requireOk(response, "Não foi possível gerar o acesso temporário.");
  const item = await response.json();
  return {
    accessToken: item.access_token ?? item.accessToken, magicLink: item.magic_link ?? item.magicLink,
    qrCodePayload: item.qr_code_payload ?? item.qrCodePayload, expiresAt: item.expires_at ?? item.expiresAt,
    expiresInSeconds: Number(item.expires_in_seconds ?? item.expiresInSeconds ?? 7200),
  };
}

export async function fetchAnvisaByBarcode(ean: string, idToken?: string): Promise<BarcodeMedication> {
  const response = await fetch(`${API_BASE_URL}/api/anvisa/medications/barcode/${encodeURIComponent(ean)}`, { headers: careHeaders(idToken) });
  await requireOk(response, "Código não localizado na base da ANVISA.");
  const item = await response.json();
  return {
    eanBarcode: item.ean_barcode ?? item.eanBarcode ?? ean, name: item.name,
    activePrinciple: item.active_principle ?? item.activePrinciple ?? null,
    concentration: item.concentration ?? null,
    pharmaceuticalForm: item.pharmaceutical_form ?? item.pharmaceuticalForm ?? null,
    manufacturer: item.manufacturer ?? null,
    farmaciaPopularEligible: item.farmacia_popular_eligible ?? item.farmaciaPopularEligible ?? null,
    sourceName: item.source_name ?? item.sourceName ?? "ANVISA", sourceUrl: item.source_url ?? item.sourceUrl ?? null,
    sourceCheckedAt: item.source_checked_at ?? item.sourceCheckedAt ?? new Date().toISOString(),
  };
}

export async function createMedication(patientId: string, input: MedicationCreateInput, idToken?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/family/patients/${encodeURIComponent(patientId)}/medications`, {
    method: "POST", headers: careHeaders(idToken, true),
    body: JSON.stringify({
      ean_barcode: input.eanBarcode || null, name: input.name,
      active_principle: input.activePrinciple || null, manufacturer: input.manufacturer || null,
      pharmaceutical_form: input.pharmaceuticalForm || null, schedule_times: input.scheduleTimes,
      total_units: input.totalUnits, alert_threshold_days: input.alertThresholdDays,
      confirmed_with_prescription: input.confirmedWithPrescription,
    }),
  });
  await requireOk(response, "Não foi possível cadastrar o medicamento.");
}

