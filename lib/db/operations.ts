import type { StoreNames, StoreValue, IndexNames, IndexKey } from "idb";
import type { CapandreDB } from "./schema";
import { getDB } from "./database";

type StoreName = StoreNames<CapandreDB>;

/**
 * Returns all items from a given store.
 */
export async function getAll<Name extends StoreName>(
  storeName: Name,
): Promise<StoreValue<CapandreDB, Name>[]> {
  const db = await getDB();
  return db.getAll(storeName);
}

/**
 * Returns all items matching a given index value.
 */
export async function getAllByIndex<
  Name extends StoreName,
  IdxName extends IndexNames<CapandreDB, Name>,
>(
  storeName: Name,
  indexName: IdxName,
  key: IndexKey<CapandreDB, Name, IdxName>,
): Promise<StoreValue<CapandreDB, Name>[]> {
  const db = await getDB();
  return db.getAllFromIndex(storeName, indexName, key);
}

/**
 * Returns a single item by its primary key.
 */
export async function getById<Name extends StoreName>(
  storeName: Name,
  id: string,
): Promise<StoreValue<CapandreDB, Name> | undefined> {
  const db = await getDB();
  return db.get(storeName, id);
}

/**
 * Creates a new item in the store. Generates a UUID if no `id` is present.
 */
export async function create<Name extends StoreName>(
  storeName: Name,
  data: StoreValue<CapandreDB, Name>,
): Promise<StoreValue<CapandreDB, Name>> {
  const db = await getDB();
  const item = { ...data };

  if (!(item as unknown as Record<string, unknown>).id) {
    (item as unknown as Record<string, unknown>).id = crypto.randomUUID();
  }

  await db.add(storeName, item);
  return item;
}

/**
 * Updates an existing item in the store by merging with the provided partial data.
 */
export async function update<Name extends StoreName>(
  storeName: Name,
  id: string,
  data: Partial<StoreValue<CapandreDB, Name>>,
): Promise<StoreValue<CapandreDB, Name>> {
  const db = await getDB();
  const existing = await db.get(storeName, id);
  if (!existing) {
    throw new Error(`Item with id "${id}" not found in store "${storeName}"`);
  }

  const updated = { ...existing, ...data, id } as StoreValue<CapandreDB, Name>;
  await db.put(storeName, updated);
  return updated;
}

/**
 * Deletes an item from a store by its primary key.
 */
export async function remove<Name extends StoreName>(
  storeName: Name,
  id: string,
): Promise<void> {
  const db = await getDB();
  await db.delete(storeName, id);
}
