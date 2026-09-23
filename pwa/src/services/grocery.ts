import { db } from "./db";
import type { GroceryItem } from "../types";

/**
 * Operações offline-first da lista de compras.
 * Tudo grava no IndexedDB primeiro; a UI nunca depende de rede.
 */

export async function loadGroceryItems(): Promise<GroceryItem[]> {
  try {
    return await db.groceryItems.toArray();
  } catch (err) {
    console.warn("Falha ao ler lista de compras local:", err);
    return [];
  }
}

// AUD-PW(M): persistGroceryItem e clearGroceryItems eram codigo MORTO —
// nenhum chamador no app inteiro (nao existe fluxo de adicionar item; a UI
// so marca/desmarca via toggleGroceryItemPantry, e o logout limpa a fila
// pelo messageQueue). Removidas.

export async function toggleGroceryItemPantry(
  id: string,
  isChecked: boolean
): Promise<void> {
  try {
    await db.groceryItems.update(id, { isCheckedInPantry: isChecked });
  } catch (err) {
    console.warn("Falha ao atualizar item local:", err);
  }
}

export async function persistGroceryItem(item: GroceryItem): Promise<void> {
  try {
    await db.groceryItems.put(item);
  } catch (err) {
    console.warn("Falha ao salvar item na lista local:", err);
  }
}
