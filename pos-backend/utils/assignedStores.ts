import type { AssignedStoreInfo } from "../types/salary.js";

type StoreLike = {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  code?: unknown;
  isActive?: unknown;
} | null | undefined;

type AssignmentLike = {
  isActive?: unknown;
  store?: StoreLike;
};

export type PickAssignedStoresOptions = {
  isAdmin: boolean;
  fallbackStore?: StoreLike;
};

function toStoreInfo(store: StoreLike): AssignedStoreInfo | null {
  if (!store || typeof store !== "object") {
    return null;
  }

  const idValue = store._id ?? store.id;
  if (idValue === undefined || idValue === null) {
    return null;
  }

  return {
    id: String(idValue),
    name: String(store.name ?? ""),
    code: String(store.code ?? "")
  };
}

export function pickAssignedStores(
  rows: AssignmentLike[],
  options: PickAssignedStoresOptions
): AssignedStoreInfo[] {
  const stores: AssignedStoreInfo[] = [];

  for (const row of rows) {
    if (row.isActive === false) {
      continue;
    }

    const store = row.store;
    if (!store || store.isActive === false) {
      continue;
    }

    const info = toStoreInfo(store);
    if (info) {
      stores.push(info);
    }
  }

  stores.sort((a, b) => a.name.localeCompare(b.name));

  if (stores.length === 0 && options.isAdmin) {
    const fallback = toStoreInfo(options.fallbackStore);
    if (fallback) {
      return [fallback];
    }
  }

  return stores;
}
