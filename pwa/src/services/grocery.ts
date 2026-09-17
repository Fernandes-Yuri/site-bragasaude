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

export async function persistGroceryItem(item: GroceryItem): Promise<void> {
  try {
    await db.groceryItems.put(item);
  } catch (err) {
    console.warn("Falha ao gravar item local:", err);
  }
}

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

export async function clearGroceryItems(): Promise<void> {
  try {
    await db.groceryItems.clear();
  } catch (err) {
    console.warn("Falha ao limpar lista local:", err);
  }
}
