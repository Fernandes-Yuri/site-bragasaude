export type CaregiverMode = "VIEWER_ONLY" | "HYBRID";

export interface CaregiverUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  mode: CaregiverMode;
}

export interface Patient {
  id: string;
  name: string;
  relationship: string;
  age: number;
  avatarUrl?: string;
  lastActive: string;
  status: "healthy" | "attention" | "critical";
  statusMessage: string;
}

export interface VitalRecord {
  id: string;
  type: "pressure" | "glucose" | "heart_rate" | "weight";
  systolic?: number;
  diastolic?: number;
  value?: number;
  unit: string;
  timestamp: string;
  severity: "normal" | "warning" | "alert";
  note?: string;
}

export interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string;
  time: string;
  isTaken: boolean;
  takenAt?: string;
  instructions?: string;
}

export interface HydrationRecord {
  currentMl: number;
  targetMl: number;
  lastIntakeAt: string;
}

export interface FamilyMessage {
  id: string;
  senderName: string;
  messageText: string;
  iconType: "LOVE" | "MEDICATION" | "WATER" | "HEART" | "EMERGENCY";
  sentAt: string;
  expiresAt: string;
}
