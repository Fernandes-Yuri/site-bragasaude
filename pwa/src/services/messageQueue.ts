import { getDatabase, type LocalScope, type BragaSaudeDatabase } from "./db";
import { sendCaregiverMessage } from "./api";
import type { FamilyMessage } from "../types";

const MAX_ATTEMPTS = 5;
export type TokenGetter = () => Promise<string | undefined>;
const expired = (message: FamilyMessage) => !Number.isFinite(Date.parse(message.expiresAt)) || Date.parse(message.expiresAt) <= Date.now();
const scopeFor = (message: FamilyMessage): LocalScope => ({ ownerId: message.senderId, patientId: message.patientId });

export async function queueMessage(message: FamilyMessage, idToken?: string): Promise<{ delivered: boolean; queued: boolean }> {
  if (expired(message)) return { delivered: false, queued: false };
  let database: BragaSaudeDatabase | undefined;
  let queued = false;
  try {
    database = await getDatabase(scopeFor(message));
    await database.messageQueue.put({ id: message.id, message, status: "pending", queuedAt: Date.now(), attempts: 0 });
    queued = true;
  } catch { /* A UI deve distinguir indisponibilidade de armazenamento e fila real. */ }
  const delivered = await tryDeliver(message, database, idToken);
  return { delivered, queued: queued && !delivered };
}

async function tryDeliver(message: FamilyMessage, database?: BragaSaudeDatabase, idToken?: string): Promise<boolean> {
  if (expired(message)) {
    await database?.messageQueue.delete(message.id);
    return false;
  }
  if (!idToken) return false; // Não consome tentativas enquanto a sessão estiver ausente.
  const result = await sendCaregiverMessage(message, idToken);
  if (result.delivered) {
    await database?.messageQueue.delete(message.id);
    return true;
  }
  if (database) {
    const entry = await database.messageQueue.get(message.id);
    if (entry) await database.messageQueue.update(message.id, {
      attempts: entry.attempts + 1,
      status: entry.attempts + 1 >= MAX_ATTEMPTS ? "failed" : "pending",
    });
  }
  return false;
}

export async function flushMessageQueue(scope: LocalScope, getToken: TokenGetter, retryFailed = false) {
  const database = await getDatabase(scope);
  let delivered = 0;
  let expiredCount = 0;
  const entries = await database.messageQueue.toArray();
  for (const entry of entries) {
    // Defesa extra contra registro corrompido ou importado de outro escopo.
    if (entry.message.senderId !== scope.ownerId || entry.message.patientId !== scope.patientId || expired(entry.message)) {
      await database.messageQueue.delete(entry.id);
      expiredCount++;
      continue;
    }
    if (entry.status === "failed" && !retryFailed) continue;
    if (entry.status === "failed") await database.messageQueue.update(entry.id, { attempts: 0, status: "pending" });
    const token = await getToken().catch(() => undefined);
    if (!token) break;
    if (await tryDeliver(entry.message, database, token)) delivered++;
  }
  return { delivered, expired: expiredCount, failed: await database.messageQueue.where("status").equals("failed").count() };
}
