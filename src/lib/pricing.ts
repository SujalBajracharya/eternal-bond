// Central pricing catalog. Currency: Nepalese Rupee (NPR).
export const CURRENCY = "NPR";
export const CURRENCY_SYMBOL = "Rs.";

export const fmt = (n: number) =>
  `${CURRENCY_SYMBOL} ${n.toLocaleString("en-IN")}`;

export type PlanId = "free" | "premium_monthly" | "premium_yearly";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price: number; // in NPR
  cadence: "forever" | "month" | "year";
  perMonth?: number;
  badge?: string;
  features: string[];
  cta: string;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything essential to begin your journey.",
    price: 0,
    cadence: "forever",
    features: [
      "Daily curated 5 matches",
      "Send unlimited interests",
      "Read messages from matches",
      "Basic filters",
      "1 free 'Reveal Like' per day",
    ],
    cta: "Your current plan",
  },
  {
    id: "premium_monthly",
    name: "Premium",
    tagline: "For those ready to meet the right person.",
    price: 1499,
    cadence: "month",
    features: [
      "Everything in Free",
      "Unlimited 'Reveal Likes'",
      "Priority Interest badge",
      "Advanced filters (lifestyle, values, compatibility)",
      "Profile Boost (weekly)",
      "Extend chats up to 30 days",
      "See who read your messages",
      "Undo skips",
    ],
    badge: "Most chosen",
    cta: "Subscribe Monthly",
  },
  {
    id: "premium_yearly",
    name: "Premium (Yearly)",
    tagline: "Save 40%. A quiet commitment to yourself.",
    price: 10788,
    perMonth: 899,
    cadence: "year",
    features: [
      "Everything in Premium Monthly",
      "2 free Profile Boosts every month",
      "Priority customer care",
      "Locked-in price for 12 months",
    ],
    badge: "Best value",
    cta: "Subscribe Yearly",
  },
];

export type PayPerAction = {
  id: string;
  title: string;
  description: string;
  price: number;
  appliesWhen: string;
};

export const PAY_PER_ACTION: PayPerAction[] = [
  {
    id: "reveal-like",
    title: "Reveal one admirer",
    description: "See one specific person who liked you.",
    price: 99,
    appliesWhen: "Applied immediately in your Likes tab.",
  },
  {
    id: "priority-interest",
    title: "Priority Interest",
    description: "Stand out in their daily set with a soft badge.",
    price: 149,
    appliesWhen: "Applies to their next daily set (within ~24h).",
  },
  {
    id: "extend-chat",
    title: "Extend chat by 7 days",
    description: "Give one conversation more room to breathe.",
    price: 99,
    appliesWhen: "New expiry applied instantly to that chat.",
  },
  {
    id: "extra-likes",
    title: "3 extra introductions today",
    description: "Add three hand-picked matches to today's set.",
    price: 80,
    appliesWhen: "Arriving in Today within the hour.",
  },
  {
    id: "undo-skip",
    title: "Undo last skip",
    description: "Bring back the last profile you dismissed.",
    price: 80,
    appliesWhen: "Restored to your current set instantly.",
  },
  {
    id: "profile-boost",
    title: "Profile Boost (24 hours)",
    description: "3× more profile views for a full day.",
    price: 299,
    appliesWhen: "Boost active for 24 hours starting now.",
  },
];

// Comparison matrix rows for the pricing table.
export const COMPARE_ROWS: {
  label: string;
  free: string | boolean;
  ppa: string | boolean;
  premium: string | boolean;
}[] = [
  {
    label: "Daily curated matches",
    free: "5 / day",
    ppa: "5 / day",
    premium: "5 + extras",
  },
  { label: "Send interests", free: true, ppa: true, premium: true },
  {
    label: "Reveal who liked you",
    free: "1 / day",
    ppa: "Pay per reveal",
    premium: "Unlimited",
  },
  { label: "Advanced filters", free: false, ppa: false, premium: true },
  {
    label: "Priority Interest badge",
    free: false,
    ppa: "Per use",
    premium: "Unlimited",
  },
  { label: "Undo skip", free: false, ppa: "Per use", premium: "Unlimited" },
  {
    label: "Extend chat window",
    free: false,
    ppa: "Per chat",
    premium: "Up to 30 days",
  },
  { label: "Profile Boost", free: false, ppa: "Per boost", premium: "Weekly" },
  { label: "Read receipts", free: false, ppa: false, premium: true },
];
