/**
 * Modelos de dados e contratos oficiais do ecossistema Braga Saúde
 * Equivalente direto a CaregiverDashboardState.kt, FamilyBindingEntity.kt e GroceryListItemEntity.kt
 */

export interface CaregiverDashboardState {
  patientUserId: string;
  patientName: string;
  caregiverRelation: string;
  caregiverName: string;
  systolic: number | null;
  diastolic: number | null;
  glucose: number | null;
  hasDiabetes: boolean;
  hydrationMl: number;
  hydrationTargetMl: number;
  steps: number;
  stepGoal: number;
  lastMeasurementLabel: string | null;
  isLoading: boolean;
  // AUD-PW(B): a badge "Ativo" do PatientHeaderCard precisa saber se há
  // vínculo — antes era sempre true e virava falso-positivo clínico.
  hasActiveBinding?: boolean;
}

export interface FamilyBinding {
  id: string;
  patientUserId: string;
  caregiverUserId: string;
  caregiverName: string;
  caregiverRelation: string;
  connectionCode: string;
  status: "PENDING" | "ACTIVE" | "REVOKED" | "EXPIRED";
  createdAt: number;
  expiresAt: number;
}

export interface GroceryItem {
  id: string;
  remoteId?: string;
  foodName: string;
  purchaseUnitText: string;
  category: string;
  estimatedPriceBrl: number;
  isCheckedInPantry: boolean;
}

export interface MessageTemplate {
  key: string;
  label: string;
  text: string;
  iconType: "water" | "medication" | "walk" | "love" | "general";
}

export interface FamilyMessage {
  id: string;
  patientId: string;
  senderId: string;
  senderName: string;
  messageText: string;
  iconType: "LOVE" | "MEDICATION" | "WATER" | "WALK" | "APPOINTMENT";
  sentAt: string;
  expiresAt: string;
}

export interface VitalHistoryRecord {
  id: string;
  measuredAt: string;
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  hydrationMl?: number;
  steps?: number;
}

