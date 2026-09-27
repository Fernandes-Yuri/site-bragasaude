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
  patientName?: string;
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
  estimatedPriceBrl?: number;
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

export interface MedicationStockItem {
  id: string;
  name: string;
  activePrinciple?: string | null;
  pharmaceuticalForm?: string | null;
  currentUnits: number;
  totalUnits: number;
  alertThresholdDays: number;
  daysRemaining: number;
  isCritical: boolean;
  photoReferenceUrl?: string | null;
  prescriptionExpiresOn?: string | null;
}

export interface ActivityFeedItem {
  id: string;
  actorId: string;
  actorName: string;
  actionType: string;
  details: Record<string, unknown>;
  occurredAt: string;
}

export interface DailyBulletin {
  patientId: string;
  day: string;
  medicationsTaken: number;
  medicationsExpected: number;
  latestBloodPressure: { systolic: number; diastolic: number; measuredAt: string } | null;
  hydrationMl: number;
  hydrationTargetMl: number;
  sleepQuality?: number | null;
  disposition?: number | null;
}

export interface ClinicalCorrelation {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  description: string;
  observedAt: string;
}

export interface MedicalAccessGrant {
  accessToken: string;
  magicLink: string;
  qrCodePayload: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export interface BarcodeMedication {
  eanBarcode: string;
  name: string;
  activePrinciple?: string | null;
  concentration?: string | null;
  pharmaceuticalForm?: string | null;
  manufacturer?: string | null;
  farmaciaPopularEligible?: boolean | null;
  sourceName: string;
  sourceUrl?: string | null;
  sourceCheckedAt: string;
}

export interface MedicationCreateInput {
  eanBarcode?: string | null;
  name: string;
  activePrinciple?: string | null;
  manufacturer?: string | null;
  pharmaceuticalForm?: string | null;
  scheduleTimes: string[];
  totalUnits: number;
  alertThresholdDays: number;
  confirmedWithPrescription: boolean;
}


/**
 * Tipos para o Feed Comunitário ("Publicações de Orgulho Familiar").
 * Documento 01_MODO_CUIDADOR_E_PONTE_FAMILIAR.md §4.
 */

export interface CommunityPost {
  id: string;
  authorName: string;
  authorUserId: string;
  authorRelation: string;
  content: string;
  type: "achievement" | "recipe" | "walk" | "milestone" | "tip";
  visibility: "community" | "family";
  createdAt: number;
  expiresAt: number;
  likes: number;
  isLikedByViewer: boolean;
}
