export type PurchaseRecord = {
  id: string;
  kind: string;
  label: string;
  appliesWhen: string;
  price: string;
  timestamp: number;
};

const KEY = "purchase_history_v1";
const MAX = 50;

export function getPurchases(): PurchaseRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PurchaseRecord[];
  } catch {
    return [];
  }
}

export function addPurchase(p: Omit<PurchaseRecord, "id" | "timestamp">): PurchaseRecord {
  const record: PurchaseRecord = {
    ...p,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  const list = [record, ...getPurchases()].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return record;
}

export function clearPurchases() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
