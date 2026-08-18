/**
 * Monetization API Service
 * Interacts with the backend monetization/Stripe endpoints.
 */

export interface EntitlementResponse {
  premium: boolean;
  tier: string;
  dailyLikeLimit: number;
  likesUsedToday: number;
  likesRemainingToday: number;
  canLike: boolean;
  extraLikePurchasedToday: boolean;
  /** -1 means unlimited (Premium). 0 means free (no reveals unless purchased). */
  dailyRevealLimit: number;
  revealsUsedToday: number;
  canRevealFree: boolean;
  revealPurchasedToday: boolean;
  canUndoSkip: boolean;
  chatExpiryDisabled: boolean;
  kundaliEnabled: boolean;
  advancedFiltersEnabled: boolean;
  /** Premium: know when messages are read in chat */
  readReceiptsEnabled: boolean;
  /** Premium: user appears with a priority badge in others' recommendation feeds */
  priorityBadgeEnabled: boolean;
  profileBoostActive: boolean;
  profileBoostExpiresAt: number | null;
  pendingUndoSkips: number;
  pendingChatExtensions: number;
  pendingRevealLikes: number;
}

export interface CheckoutRequest {
  productId: string;
  context?: Record<string, string>;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

function getHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetches the user's current entitlements snapshot.
 */
export async function getEntitlements(token: string): Promise<EntitlementResponse> {
  const url = `${API_BASE_URL}/api/monetize/entitlements`;
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user entitlements");
  }
  return response.json();
}

/**
 * Marks a single-use entitlement as consumed.
 */
export async function consumeEntitlement(token: string, entitlementKey: string): Promise<{ success: boolean; consumed: string }> {
  const url = `${API_BASE_URL}/api/monetize/consume`;
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ entitlementKey }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to consume entitlement ${entitlementKey}`);
  }
  return response.json();
}

/** Creates a server-owned Stripe Checkout Session and returns its hosted URL. */
export async function createCheckoutSession(token: string, request: CheckoutRequest): Promise<CheckoutSessionResponse> {
  const url = `${API_BASE_URL}/create-checkout-session`;
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      throw new Error("Your session has expired. Please sign in and try again.");
    }
    throw new Error(errData.message || "Unable to start secure checkout. Please try again.");
  }
  const data = await response.json();
  const checkoutUrl = data.checkoutUrl ?? data.url;
  if (typeof checkoutUrl !== "string" || !checkoutUrl) {
    throw new Error("Checkout is temporarily unavailable. Please try again.");
  }
  return { checkoutUrl };
}

/**
 * Consumes one extend_chat entitlement to extend a match by 24 hours.
 */
export async function extendChat(token: string, matchId: string): Promise<{ success: boolean; newExpiry: string }> {
  const url = `${API_BASE_URL}/api/monetize/extend-chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ matchId }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to extend chat");
  }
  return response.json();
}
