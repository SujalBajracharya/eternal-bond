// Lightweight localization for receipt-related strings.
// Detects browser language; falls back to English. Easy to extend.

type Lang = "en" | "hi";

const STRINGS = {
  en: {
    receiptSavedDescription: (appliesWhen: string, price: string, ts: string) =>
      `${appliesWhen} · ${price} · ${ts}`,
    viewReceipt: "View receipt",
    receipts: "Receipts",
    purchaseHistory: "Purchase history",
    noPurchasesYet: "No purchases yet.",
    noPurchasesHint: "When you confirm an upgrade, your receipt appears here.",
    appliesLabel: "Applies",
    paid: "Paid",
    on: "on",
    clearHistory: "Clear history",
    back: "Back",
  },
  hi: {
    receiptSavedDescription: (appliesWhen: string, price: string, ts: string) =>
      `${appliesWhen} · ${price} · ${ts}`,
    viewReceipt: "रसीद देखें",
    receipts: "रसीदें",
    purchaseHistory: "खरीद का इतिहास",
    noPurchasesYet: "अभी तक कोई खरीद नहीं।",
    noPurchasesHint: "जब आप अपग्रेड पुष्ट करेंगे, आपकी रसीद यहाँ दिखेगी।",
    appliesLabel: "लागू",
    paid: "भुगतान",
    on: "को",
    clearHistory: "इतिहास साफ़ करें",
    back: "वापस",
  },
} as const;

function detectLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const l = (navigator.language || "en").toLowerCase();
  if (l.startsWith("hi")) return "hi";
  return "en";
}

export const lang: Lang = detectLang();
export const t = STRINGS[lang];

export function formatTimestamp(ts: number): string {
  try {
    return new Date(ts).toLocaleString(lang === "hi" ? "hi-IN" : undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function formatFullTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(lang === "hi" ? "hi-IN" : undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
