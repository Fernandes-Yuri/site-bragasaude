import Dexie, { type Table } from "dexie";
import type { GroceryItem, FamilyMessage } from "../types";

/**
 * Banco local offline-first do PWA Cuidador (IndexedDB via Dexie).
 *
 * Tabelas:
 * - groceryItems: lista de compras compartilhada (sincroniza quando online)
 * - messageQueue: mensagens familiares pendentes de entrega ao Gateway
 *
 * Referencia: 03_FAMILIA_CUIDADOR_E_PWA/02_PWA_ARQUITETURA_DO_CUIDADOR.md (5.2)
 */
export class BragaSaudeDatabase extends Dexie {
  groceryItems!: Table<GroceryItem, string>;
  messageQueue!: Table<QueuedMessage, string>;

  constructor() {
    super("braga-saude-cuidador");

    this.version(1).stores({
      groceryItems: "id, remoteId, foodName, isCheckedInPantry",
      messageQueue: "id, patientId, status, queuedAt",
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

export const db = new BragaSaudeDatabase();
