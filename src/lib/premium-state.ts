// Mock subscription + usage state, persisted in localStorage.
import { PlanId } from "./pricing";

export type Subscription = {
  planId: PlanId;
  startedAt: number;
  renewsAt: number | null; // null for free
  autoRenew: boolean;
  status: "active" | "cancelled" | "expired";
};

export type Usage = {
  revealsUsedToday: number;
  revealsLimitToday: number;
  boostActiveUntil: number | null;
  extraLikesUsedToday: number;
};

const SUB_KEY = "subscription_v1";
const USAGE_KEY = "usage_v1";

const defaultSub = (): Subscription => ({
  planId: "free",
  startedAt: Date.now(),
  renewsAt: null,
  autoRenew: false,
  status: "active",
});

const defaultUsage = (): Usage => ({
  revealsUsedToday: 0,
  revealsLimitToday: 1,
  boostActiveUntil: null,
  extraLikesUsedToday: 0,
});

export function getSubscription(): Subscription {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return defaultSub();
    return { ...defaultSub(), ...JSON.parse(raw) };
  } catch {
    return defaultSub();
  }
}

export function setSubscription(next: Partial<Subscription>) {
  const merged = { ...getSubscription(), ...next };
  localStorage.setItem(SUB_KEY, JSON.stringify(merged));
  window.dispatchEvent(new Event("subscription-changed"));
  return merged;
}

export function activatePlan(planId: PlanId) {
  const now = Date.now();
  const days = planId === "premium_yearly" ? 365 : planId === "premium_monthly" ? 30 : 0;
  return setSubscription({
    planId,
    startedAt: now,
    renewsAt: days ? now + days * 24 * 3600 * 1000 : null,
    autoRenew: planId !== "free",
    status: "active",
  });
}

export function cancelSubscription() {
  return setSubscription({ autoRenew: false, status: "cancelled" });
}

export function resumeSubscription() {
  return setSubscription({ autoRenew: true, status: "active" });
}

export function getUsage(): Usage {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return defaultUsage();
    return { ...defaultUsage(), ...JSON.parse(raw) };
  } catch {
    return defaultUsage();
  }
}

export function setUsage(next: Partial<Usage>) {
  const merged = { ...getUsage(), ...next };
  localStorage.setItem(USAGE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new Event("usage-changed"));
  return merged;
}

export function isPremium(sub?: Subscription) {
  const s = sub ?? getSubscription();
  return s.planId !== "free" && s.status === "active";
}
