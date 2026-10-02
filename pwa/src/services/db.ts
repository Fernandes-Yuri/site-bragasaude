import Dexie, { type Table } from "dexie";
import type { GroceryItem, FamilyMessage } from "../types";

export interface LocalScope { ownerId: string; patientId: string }
const PREFIX = "braga-saude-cuidador-v2:";
export const scopeKey = (scope: LocalScope) => `${encodeURIComponent(scope.ownerId)}:${encodeURIComponent(scope.patientId)}`;

export class BragaSaudeDatabase extends Dexie {
  groceryItems!: Table<GroceryItem, string>;
  messageQueue!: Table<QueuedMessage, string>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({
      groceryItems: "id, remoteId, foodName, isCheckedInPantry",
      messageQueue: "id, status, queuedAt",
    });
  }
}
export interface QueuedMessage {
  id: string;
  message: FamilyMessage;
  status: "pending" | "failed";
  queuedAt: number;
  attempts: number;
}
const databases = new Map<string, BragaSaudeDatabase>();
let legacyCleanup: Promise<void> | undefined;
export async function getDatabase(scope: LocalScope): Promise<BragaSaudeDatabase> {
  if (!scope.ownerId || !scope.patientId) throw new Error("Conta e paciente são obrigatórios para armazenamento local.");
  // O banco antigo não registra o dono das compras: não atribuir dados a quem entrar agora.
  legacyCleanup ??= Dexie.delete("braga-saude-cuidador");
  await legacyCleanup;
  const name = PREFIX + scopeKey(scope);
  let database = databases.get(name);
  if (!database) {
    database = new BragaSaudeDatabase(name);
    databases.set(name, database);
  }
  if (!database.isOpen()) await database.open();
  return database;
}
export async function clearAccountData(ownerId: string): Promise<void> {
  const prefix = PREFIX + encodeURIComponent(ownerId) + ":";
  const names = new Set([...await Dexie.getDatabaseNames(), ...databases.keys()]);
  for (const name of names) {
    if (!name.startsWith(prefix)) continue;
    databases.get(name)?.close();
    databases.delete(name);
    await Dexie.delete(name);
  }
}
