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
  dailyRevealLimit: number;
  revealsUsedToday: number;
  canRevealFree: boolean;
  revealPurchasedToday: boolean;
  canUndoSkip: boolean;
  chatExpiryDisabled: boolean;
  kundaliEnabled: boolean;
  advancedFiltersEnabled: boolean;
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

export interface CheckoutResponse {
  clientSecret: string;
  paymentId: string;
  amountNpr: number;
  productName: string;
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

/**
 * Initiates a Stripe checkout by creating a PaymentIntent.
 * Returns the clientSecret to configure Stripe.js or custom checkout flows.
 */
export async function initiateCheckout(token: string, request: CheckoutRequest): Promise<CheckoutResponse> {
  const url = `${API_BASE_URL}/api/monetize/checkout`;
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to initiate checkout");
  }
  return response.json();
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

/**
 * Development/Sandbox helper to simulate a successful payment.
 */
export async function simulatePayment(token: string, paymentIntentId: string): Promise<{ success: boolean; message: string }> {
  const url = `${API_BASE_URL}/api/monetize/simulate-payment`;
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ paymentIntentId }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to simulate payment");
  }
  return response.json();
}
