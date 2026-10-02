import { getDatabase, type LocalScope } from "./db";
import type { GroceryItem } from "../types";

export async function loadGroceryItems(scope: LocalScope): Promise<GroceryItem[]> {
  return (await getDatabase(scope)).groceryItems.toArray();
}
export async function toggleGroceryItemPantry(scope: LocalScope, id: string, isChecked: boolean): Promise<void> {
  await (await getDatabase(scope)).groceryItems.update(id, { isCheckedInPantry: isChecked });
}
export async function persistGroceryItem(scope: LocalScope, item: GroceryItem): Promise<void> {
  await (await getDatabase(scope)).groceryItems.put(item);
}
