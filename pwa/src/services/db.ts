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
async function scopedDatabase(scope: LocalScope): Promise<BragaSaudeDatabase> {
  const name = PREFIX + scopeKey(scope);
  let database = databases.get(name);
  if (!database) {
    database = new BragaSaudeDatabase(name);
    databases.set(name, database);
  }
  if (!database.isOpen()) await database.open();
  return database;
}
async function migrateLegacy(): Promise<void> {
  const legacyName = "braga-saude-cuidador";
  if (!await Dexie.exists(legacyName)) return;
  const legacy = new Dexie(legacyName);
  try {
    await legacy.open();
    if (legacy.tables.some(table => table.name === "messageQueue")) {
      const entries = await legacy.table<QueuedMessage, string>("messageQueue").toArray();
      for (const entry of entries) {
        const message = entry.message;
        if (!message || typeof message.senderId !== "string" || !message.senderId ||
            typeof message.patientId !== "string" || !message.patientId ||
            typeof message.id !== "string" || message.id !== entry.id ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(message.id) ||
            !Number.isFinite(Date.parse(message.expiresAt)) || Date.parse(message.expiresAt) <= Date.now()) continue;
        const target = await scopedDatabase({ ownerId: message.senderId, patientId: message.patientId });
        // Repetir a migração após uma falha não reinicia prazo nem tentativas.
        if (!await target.messageQueue.get(entry.id)) await target.messageQueue.put(entry);
      }
    }
  } finally { legacy.close(); }
  // Compras sem dono não são atribuídas a quem entra agora. Fila válida já foi particionada.
  await Dexie.delete(legacyName);
}
export async function getDatabase(scope: LocalScope): Promise<BragaSaudeDatabase> {
  if (!scope.ownerId || !scope.patientId) throw new Error("Conta e paciente são obrigatórios para armazenamento local.");
  legacyCleanup ??= migrateLegacy();
  await legacyCleanup;
  return scopedDatabase(scope);
}
export async function clearAccountData(ownerId: string): Promise<void> {
  legacyCleanup ??= migrateLegacy();
  await legacyCleanup;
  const prefix = PREFIX + encodeURIComponent(ownerId) + ":";
  const names = new Set([...await Dexie.getDatabaseNames(), ...databases.keys()]);
  for (const name of names) {
    if (!name.startsWith(prefix)) continue;
    databases.get(name)?.close();
    databases.delete(name);
    await Dexie.delete(name);
  }
}
