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

/**
 * Getter de token injetavel. Tokens do Firebase expiram em ~1h, e a fila
 * pode sobreviver a quedas longas, entao NAO persistimos o token: buscamos
 * uma versao fresca a cada entrega. Sem isso o POST sai sem Authorization
 * e a mensagem queima todas as tentativas.
 */
export type TokenGetter = () => Promise<string | undefined>;

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
 *
 * `getToken` e obrigatorio: sem um token fresco o Gateway rejeita a entrega
 * e as mensagens queimam todas as tentativas.
 */
export async function flushMessageQueue(
  getToken: TokenGetter
): Promise<number> {
  let deliveredCount = 0;

  try {
    const pending = await db.messageQueue
      .where("status")
      .equals("pending")
      .toArray();

    for (const entry of pending) {
      const idToken = await getToken().catch(() => undefined);
      const ok = await tryDeliver(entry.message, idToken);
      if (ok) deliveredCount++;
    }
  } catch (err) {
    console.warn("Falha ao processar fila de mensagens:", err);
  }

  return deliveredCount;
}

// AUD-PW(M): getPendingMessageCount era codigo MORTO — definido mas sem
// nenhum chamador no app. Removido (a UI de "enviando" usa o estado local
// do componente, nao esta contagem).

/**
 * Limpa a fila de mensagens do IndexedDB — deve rodar no logout.
 *
 * AUD-PW02: a fila é persistida no IndexedDB e continha textos de mensagens
 * familiares de quem saiu. Em aparelho compartilhado, o próximo usuário via
 * o conteúdo na fila (e ela tentava entregar com o token novo — mensagem
 * cruzada entre contas).
 */
export async function clearMessageQueue(): Promise<void> {
  try {
    await db.messageQueue.clear();
  } catch (err) {
    console.warn("Falha ao limpar fila de mensagens:", err);
  }
}
