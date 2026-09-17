import { db } from "./db";
import { sendCaregiverMessage } from "./api";
import type { FamilyMessage } from "../types";

/**
 * Enfileira uma mensagem familiar para entrega persistente.
 *
 * 1. Grava no IndexedDB imediatamente (garante que não se perde)
 * 2. Tenta entregar ao Gateway na hora
 * 3. Se falhar, fica na fila ate a conexao voltar
 *
 * Referencia: 02_PWA_ARQUITETURA_DO_CUIDADOR.md, fluxo offline
 */

const MAX_ATTEMPTS = 5;

export async function queueMessage(
  message: FamilyMessage,
  idToken?: string
): Promise<{ delivered: boolean; queued: boolean }> {
  try {
    await db.messageQueue.put({
      id: message.id,
      message,
      status: "pending",
      queuedAt: Date.now(),
      attempts: 0,
    });
  } catch (err) {
    console.warn("Falha ao enfileirar mensagem:", err);
  }

  const delivered = await tryDeliver(message, idToken);
  return { delivered, queued: true };
}

async function tryDeliver(
  message: FamilyMessage,
  idToken?: string
): Promise<boolean> {
  try {
    const result = await sendCaregiverMessage(
      message.patientId,
      message.messageText,
      message.iconType,
      message.senderName,
      message.senderId,
      idToken
    );

    if (result.delivered) {
      await db.messageQueue.delete(message.id).catch(() => {});
      return true;
    }

    // Mantem na fila para retry posterior
    await bumpAttempts(message.id);
    return false;
  } catch (err) {
    console.warn("Entrega falhou, mensagem permanece na fila:", err);
    await bumpAttempts(message.id);
    return false;
  }
}

async function bumpAttempts(id: string): Promise<void> {
  try {
    const entry = await db.messageQueue.get(id);
    if (!entry) return;
    await db.messageQueue.update(id, {
      attempts: entry.attempts + 1,
      status: entry.attempts + 1 >= MAX_ATTEMPTS ? "failed" : "pending",
    });
  } catch (err) {
    console.warn("Falha ao atualizar tentativas:", err);
  }
}

/**
 * Processa a fila de mensagens pendentes.
 * Chamado quando a conexao retorna (evento online) ou no pull-to-refresh.
 */
export async function flushMessageQueue(): Promise<number> {
  let deliveredCount = 0;

  try {
    const pending = await db.messageQueue
      .where("status")
      .equals("pending")
      .toArray();

    for (const entry of pending) {
      const ok = await tryDeliver(entry.message);
      if (ok) deliveredCount++;
    }
  } catch (err) {
    console.warn("Falha ao processar fila de mensagens:", err);
  }

  return deliveredCount;
}

/**
 * Total de mensagens aguardando entrega (para feedback na UI).
 */
export async function getPendingMessageCount(): Promise<number> {
  try {
    return await db.messageQueue.where("status").equals("pending").count();
  } catch {
    return 0;
  }
}
