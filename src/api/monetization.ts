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
  /** Yearly Premium: priority customer care is available. */
  priorityCustomerCareEnabled: boolean;
  /** Yearly Premium: the recorded purchase price remains identifiable. */
  lockedInPricingEnabled: boolean;
  profileBoostActive: boolean;
  profileBoostExpiresAt: number | null;
  profileBoostsAvailable: number;
  profileBoostGrants: ProfileBoostGrant[];
  pendingUndoSkips: number;
  pendingChatExtensions: number;
  pendingRevealLikes: number;
  pendingPriorityInterests: number;
}

export interface ProfileBoostGrant {
  grantType: string | null;
  grantPeriod: string | null;
  available: boolean;
  active: boolean;
  expiresAt: string | null;
}

export interface PriorityInterestActivationResponse {
  targetProfileId: string;
  expiresAt: string;
  priorityInterestsRemaining: number;
}

export class MonetizationApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "MonetizationApiError";
  }
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

async function throwApiError(response: Response, fallback: string): Promise<never> {
  const errData = await response.json().catch(() => ({}));
  const message =
    errData.message ||
    (response.status === 401
      ? "Your session has expired. Please sign in again."
      : response.status === 404
        ? "That Premium benefit is not available right now."
        : response.status === 409
          ? "This Premium action is already active or was already used."
          : response.status === 429
            ? "Today's allowance has already been used."
            : fallback);
  throw new MonetizationApiError(response.status, message);
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
    return throwApiError(response, "Failed to fetch user entitlements");
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
    return throwApiError(response, `Failed to consume entitlement ${entitlementKey}`);
  }
  return response.json();
}

/** Activates one available recurring Profile Boost. */
export async function activateProfileBoost(token: string): Promise<EntitlementResponse> {
  const response = await fetch(`${API_BASE_URL}/api/monetize/profile-boost/activate`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({}),
  });
  if (!response.ok) return throwApiError(response, "Unable to activate Profile Boost.");
  return response.json();
}

/** Consumes one daily free Reveal Like for free users. */
export async function consumeFreeReveal(token: string): Promise<EntitlementResponse> {
  const response = await fetch(`${API_BASE_URL}/api/monetize/reveal-like/consume`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({}),
  });
  if (!response.ok) return throwApiError(response, "Unable to use today's free reveal.");
  return response.json();
}

/** Activates one purchased Priority Interest for a target profile. */
export async function activatePriorityInterest(
  token: string,
  targetProfileId: string,
): Promise<PriorityInterestActivationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/monetize/priority-interest/activate`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ targetProfileId }),
  });
  if (!response.ok) return throwApiError(response, "Unable to send Priority Interest.");
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
      return throwApiError(response, "Unable to start secure checkout. Please try again.");
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
    return throwApiError(response, "Failed to extend chat");
  }
  return response.json();
}
