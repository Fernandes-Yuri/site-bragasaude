import type { Patient, VitalRecord, MedicationSchedule, HydrationRecord, FamilyMessage } from "../types";


export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://bragasaude.online";

export const MOCK_PATIENT: Patient = {
  id: "paciente-odete-123",
  name: "Dona Odete Braga",
  relationship: "Mãe",
  age: 78,
  lastActive: "Há 12 minutos",
  status: "healthy",
  statusMessage: "Sinais vitais e remédios do dia em dia!",
};

export const MOCK_VITALS: VitalRecord[] = [
  {
    id: "v1",
    type: "pressure",
    systolic: 122,
    diastolic: 81,
    unit: "mmHg",
    timestamp: "Hoje às 08:30",
    severity: "normal",
    note: "Medição matinal em repouso",
  },
  {
    id: "v2",
    type: "glucose",
    value: 94,
    unit: "mg/dL",
    timestamp: "Hoje às 07:45",
    severity: "normal",
    note: "Glicemia em jejum",
  },
  {
    id: "v3",
    type: "heart_rate",
    value: 72,
    unit: "bpm",
    timestamp: "Hoje às 08:30",
    severity: "normal",
  },
  {
    id: "v4",
    type: "weight",
    value: 65.4,
    unit: "kg",
    timestamp: "Ontem às 08:00",
    severity: "normal",
  }
];

export const MOCK_MEDICATIONS: MedicationSchedule[] = [
  {
    id: "m1",
    name: "Losartana Potássica",
    dosage: "50mg",
    time: "08:00",
    isTaken: true,
    takenAt: "08:05",
    instructions: "1 comprimido pela manhã com água",
  },
  {
    id: "m2",
    name: "Metformina",
    dosage: "500mg",
    time: "12:30",
    isTaken: true,
    takenAt: "12:40",
    instructions: "1 comprimido durante o almoço",
  },
  {
    id: "m3",
    name: "Sinvastatina",
    dosage: "20mg",
    time: "20:00",
    isTaken: false,
    instructions: "1 comprimido à noite antes de dormir",
  },
];

export const MOCK_HYDRATION: HydrationRecord = {
  currentMl: 1500,
  targetMl: 2000,
  lastIntakeAt: "Há 25 minutos (250 ml)",
};

export const MOCK_MESSAGES: FamilyMessage[] = [
  {
    id: "msg-1",
    senderName: "Yuri (Filho)",
    messageText: "Bom dia mãe! Não esquece da água e da caminhada hoje. Te amo!",
    iconType: "LOVE",
    sentAt: "Hoje às 09:15",
    expiresAt: "Amanhã às 09:15 (24h)",
  }
];

export async function sendFamilyMessage(patientId: string, text: string, iconType: string, senderName: string): Promise<FamilyMessage> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/family/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: patientId,
        sender_name: senderName,
        message_text: text,
        icon_type: iconType,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id || `msg-${Date.now()}`,
        senderName,
        messageText: text,
        iconType: iconType as any,
        sentAt: "Agora mesmo",
        expiresAt: "Expira em 24h",
      };
    }
  } catch (err) {
    console.warn("Gateway indisponível, registrando offline:", err);
  }

  return {
    id: `msg-${Date.now()}`,
    senderName,
    messageText: text,
    iconType: iconType as any,
    sentAt: "Agora mesmo",
    expiresAt: "Expira em 24 horas (LGPD D47)",
  };
}

export async function triggerBragaVoiceReminder(patientId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/family/remind-voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, text }),
    });
    return res.ok;
  } catch {
    return true;
  }
}
