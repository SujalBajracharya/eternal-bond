import { useQuery } from "@tanstack/react-query";
import { Compass, Star, AlertCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   API Types & Fetch
   ───────────────────────────────────────────────────────────────────────── */

interface KootaInfo {
  receivedPoints: number;
  totalPoints: number;
  maleAttribute: string | null;
  femaleAttribute: string | null;
  description: string | null;
}

interface AstrologyMatchResult {
  receivedPoints: number;
  totalPoints: number;
  matchFavorable: boolean;
  conclusionMessage: string | null;
  varna: KootaInfo | null;
  vashya: KootaInfo | null;
  tara: KootaInfo | null;
  yoni: KootaInfo | null;
  grahaMaitri: KootaInfo | null;
  gana: KootaInfo | null;
  bhakoot: KootaInfo | null;
  nadi: KootaInfo | null;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

async function fetchCompatibility(
  targetProfileId: string
): Promise<AstrologyMatchResult> {
  const token = localStorage.getItem("jwt_token");
  const res = await fetch(
    `${API_BASE_URL}/api/astrology/match/${targetProfileId}`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "application/json",
      },
    }
  );

  if (res.status === 404) throw new Error("KUNDALI_NOT_FOUND");
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "INCOMPLETE_KUNDALI");
  }
  if (!res.ok) throw new Error("API_ERROR");

  const body = await res.json();

  // The backend returns a wrapped shape { statusCode, output: { ... } }
  // while the frontend expects a flattened `AstrologyMatchResult`. Map
  // the API response to the shape used by this component.
  const out = body?.output ?? body;

  const mapKoota = (k: any, keyName: string): KootaInfo | null => {
    if (!k) return null;

    // Support both raw API shape (score/out_of + bride/groom) and
    // internal DTO shape (receivedPoints/totalPoints + maleAttribute/femaleAttribute)
    const received = typeof k.score === "number" ? k.score : (typeof k.receivedPoints === "number" ? k.receivedPoints : 0);
    const total = typeof k.out_of === "number" ? k.out_of : (typeof k.totalPoints === "number" ? k.totalPoints : 0);

    // male/female attributes: prefer DTO fields, fall back to bride/groom party details
    const maleAttr = k.maleAttribute ?? k.male_attribute ?? (
      k.groom?.varnam_name ?? k.groom?.groom_kootam_name ?? k.groom?.star_name ?? k.groom?.moon_sign ?? k.groom?.moon_sign_name ?? k.groom?.yoni ?? k.groom?.nadi_name ?? null
    );
    const femaleAttr = k.femaleAttribute ?? k.female_attribute ?? (
      k.bride?.varnam_name ?? k.bride?.bride_kootam_name ?? k.bride?.star_name ?? k.bride?.moon_sign ?? k.bride?.moon_sign_name ?? k.bride?.yoni ?? k.bride?.nadi_name ?? null
    );

    const desc = k.description ?? k.desc ?? null;

    return {
      receivedPoints: received,
      totalPoints: total,
      maleAttribute: maleAttr,
      femaleAttribute: femaleAttr,
      description: desc,
    };
  };

  const result: AstrologyMatchResult = {
    receivedPoints: out?.total_score ?? out?.receivedPoints ?? 0,
    totalPoints: out?.out_of ?? out?.totalPoints ?? 36,
    // Favorability: common Ashtakoot threshold is 18/36 — treat as favourable when >= 18
    matchFavorable: (out?.total_score ?? 0) >= 18,
    conclusionMessage: out?.conclusion_message ?? out?.conclusionMessage ?? null,
    varna: mapKoota(out?.varna ?? out?.varna_kootam, "varna"),
    vashya: mapKoota(out?.vashya ?? out?.vasya_kootam ?? out?.vashya_kootam, "vashya"),
    tara: mapKoota(out?.tara ?? out?.tara_kootam, "tara"),
    yoni: mapKoota(out?.yoni ?? out?.yoni_kootam, "yoni"),
    grahaMaitri: mapKoota(out?.grahaMaitri ?? out?.graha_maitri_kootam, "grahaMaitri"),
    gana: mapKoota(out?.gana ?? out?.gana_kootam, "gana"),
    bhakoot: mapKoota(out?.bhakoot ?? out?.rasi ?? out?.rasi_kootam ?? out?.bhakoot_kootam, "bhakoot"),
    nadi: mapKoota(out?.nadi ?? out?.nadi_kootam, "nadi"),
  };

  return result;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Compatibility level helpers
   ───────────────────────────────────────────────────────────────────────── */

type CompatLevel = "Excellent" | "Very Good" | "Good" | "Average" | "Poor";

function compatLevel(score: number, max: number): CompatLevel {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 88) return "Excellent";
  if (pct >= 69) return "Very Good";
  if (pct >= 50) return "Good";
  if (pct >= 36) return "Average";
  return "Poor";
}

const LEVEL_CONFIG: Record<
  CompatLevel,
  { gradient: string; text: string; ring: string; badge: string }
> = {
  Excellent: {
    gradient: "from-emerald-500 to-teal-400",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "stroke-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  "Very Good": {
    gradient: "from-primary to-primary/70",
    text: "text-primary",
    ring: "stroke-primary",
    badge: "bg-primary/10 text-primary",
  },
  Good: {
    gradient: "from-amber-500 to-yellow-400",
    text: "text-amber-600 dark:text-amber-400",
    ring: "stroke-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  Average: {
    gradient: "from-orange-400 to-amber-300",
    text: "text-orange-600 dark:text-orange-400",
    ring: "stroke-orange-400",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  Poor: {
    gradient: "from-rose-500 to-red-400",
    text: "text-rose-600 dark:text-rose-400",
    ring: "stroke-rose-500",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Koota meta — labels + short description shown when API returns null
   ───────────────────────────────────────────────────────────────────────── */

const KOOTA_META: {
  key: keyof Omit<
    AstrologyMatchResult,
    "receivedPoints" | "totalPoints" | "matchFavorable" | "conclusionMessage"
  >;
  label: string;
  maxPoints: number;
  fallbackDesc: string;
  emoji: string;
}[] = [
  {
    key: "varna",
    label: "Varna",
    maxPoints: 1,
    fallbackDesc: "Spiritual and ego compatibility.",
    emoji: "✨",
  },
  {
    key: "vashya",
    label: "Vasya",
    maxPoints: 2,
    fallbackDesc: "Mutual attraction and influence.",
    emoji: "🌀",
  },
  {
    key: "tara",
    label: "Tara",
    maxPoints: 3,
    fallbackDesc: "Destiny and birth-star alignment.",
    emoji: "⭐",
  },
  {
    key: "yoni",
    label: "Yoni",
    maxPoints: 4,
    fallbackDesc: "Physical and intimate compatibility.",
    emoji: "🌸",
  },
  {
    key: "grahaMaitri",
    label: "Graha Maitri",
    maxPoints: 5,
    fallbackDesc: "Mental and emotional wavelength.",
    emoji: "🧠",
  },
  {
    key: "gana",
    label: "Gana",
    maxPoints: 6,
    fallbackDesc: "Temperament and nature alignment.",
    emoji: "🌿",
  },
  {
    key: "bhakoot",
    label: "Bhakoot (Rasi)",
    maxPoints: 7,
    fallbackDesc: "Financial stability and family welfare.",
    emoji: "🏡",
  },
  {
    key: "nadi",
    label: "Nadi",
    maxPoints: 8,
    fallbackDesc: "Health, energy, and progeny prospects.",
    emoji: "💚",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────────────────────── */

/** Circular SVG progress ring */
function ScoreRing({
  score,
  max,
  level,
  size = 160,
}: {
  score: number;
  max: number;
  level: CompatLevel;
  size?: number;
}) {
  const cfg = LEVEL_CONFIG[level];
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? score / max : 0;
  const dash = pct * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={10}
          className="text-border/40"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className={cn("transition-all duration-1000", cfg.ring)}
        />
      </svg>
      {/* Centre text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-serif font-black", cfg.text)}>
          {score}
        </span>
        <span className="text-[11px] text-muted-foreground font-medium">
          out of {max}
        </span>
      </div>
    </div>
  );
}

/** Individual Koota card */
function KootaCard({ info, meta }: { info: KootaInfo | null; meta: typeof KOOTA_META[number] }) {
  const received = info?.receivedPoints ?? 0;
  const total    = info?.totalPoints   ?? meta.maxPoints;
  const pct      = total > 0 ? received / total : 0;
  const desc     = info?.description ?? meta.fallbackDesc;

  // Bar colour tiers
  const barClass =
    pct >= 0.75
      ? "bg-emerald-500"
      : pct >= 0.5
      ? "bg-amber-400"
      : "bg-rose-500";

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 dark:bg-card/60 backdrop-blur-sm p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{meta.emoji}</span>
          <span className="font-semibold text-[15px] text-foreground">{meta.label}</span>
        </div>
        <span className="text-sm font-bold text-foreground shrink-0">
          {received}
          <span className="text-muted-foreground font-normal text-xs"> / {total}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barClass)}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      {/* Description */}
      {desc && (
        <p className="text-[12.5px] text-muted-foreground leading-snug line-clamp-3">
          {desc}
        </p>
      )}
    </div>
  );
}

/** Skeleton placeholder for a single Koota card */
function KootaCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 rounded-lg bg-muted/60" />
        <div className="h-4 w-10 rounded-lg bg-muted/60" />
      </div>
      <div className="h-2 w-full rounded-full bg-muted/40" />
      <div className="space-y-1">
        <div className="h-3 w-full rounded bg-muted/30" />
        <div className="h-3 w-4/5 rounded bg-muted/30" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────────────────────── */

interface Props {
  /** The target user's profile ID (from URL params or parent state) */
  targetProfileId: string;
}

export default function KundaliCompatibility({ targetProfileId }: Props) {
  const { data, isLoading, error } = useQuery<AstrologyMatchResult, Error>({
    queryKey: ["kundaliCompatibility", targetProfileId],
    queryFn: () => fetchCompatibility(targetProfileId),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min — score won't change mid-session
  });

  /* ── Loading skeleton ─────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <section aria-busy="true" className="space-y-6">
        {/* Hero skeleton */}
        <div className="rounded-2xl border border-border/70 bg-card/80 p-8 flex flex-col sm:flex-row items-center gap-8 animate-pulse">
          <div className="rounded-full bg-muted/40 shrink-0" style={{ width: 160, height: 160 }} />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-6 w-40 rounded-lg bg-muted/60" />
            <div className="h-4 w-24 rounded-lg bg-muted/40" />
            <div className="h-14 w-full rounded-2xl bg-muted/30" />
          </div>
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <KootaCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  /* ── Error states ─────────────────────────────────────────────────────── */
  if (error) {
    const isNotFound =
      error.message === "KUNDALI_NOT_FOUND" ||
      error.message === "INCOMPLETE_KUNDALI";

    return (
      <div className="rounded-2xl border border-border/70 bg-card/80 p-10 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center">
          {isNotFound ? (
            <Lock className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <AlertCircle className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          )}
        </div>
        <div>
          <h4 className="font-serif text-lg font-semibold text-foreground">
            {isNotFound
              ? "Kundali data not available"
              : "Compatibility unavailable"}
          </h4>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {isNotFound
              ? "This profile hasn't filled in their birth details yet. Both you and this person need a complete Kundali profile for compatibility analysis."
              : "We couldn't reach the astrology service right now. Please try again in a moment."}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const level = compatLevel(data.receivedPoints, data.totalPoints);
  const cfg   = LEVEL_CONFIG[level];

  /* ── Full result ──────────────────────────────────────────────────────── */
  return (
    <section className="space-y-6">
      {/* ── Hero score card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card/90 dark:bg-card/70 backdrop-blur-sm p-8 shadow-sm flex flex-col sm:flex-row items-center gap-8">
        {/* Circular progress */}
        <div className="shrink-0">
          <ScoreRing
            score={data.receivedPoints}
            max={data.totalPoints}
            level={level}
          />
        </div>

        {/* Score summary */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
            <h3 className="font-serif text-2xl font-bold text-foreground leading-tight">
              Ashtakoot Compatibility
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full shrink-0",
                cfg.badge
              )}
            >
              <Star className="h-3 w-3 fill-current" />
              {level}
            </span>
          </div>

          {/* Koota bars mini-legend */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            {KOOTA_META.map((m) => {
              const k = data[m.key] as KootaInfo | null;
              const r = k?.receivedPoints ?? 0;
              const t = k?.totalPoints ?? m.maxPoints;
              return (
                <div
                  key={m.key}
                  className="flex flex-col items-center gap-0.5"
                  title={`${m.label}: ${r}/${t}`}
                >
                  <span className="text-[10px] text-muted-foreground">{m.emoji}</span>
                  <div className="w-6 h-1.5 rounded-full bg-border/40 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        t > 0 && r / t >= 0.75
                          ? "bg-emerald-500"
                          : t > 0 && r / t >= 0.5
                          ? "bg-amber-400"
                          : "bg-rose-500"
                      )}
                      style={{ width: `${t > 0 ? (r / t) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conclusion */}
          {data.conclusionMessage && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-prose bg-muted/30 dark:bg-muted/20 rounded-xl px-4 py-3 border border-border/40">
              {data.conclusionMessage}
            </p>
          )}

          {/* Favorability badge */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <Compass className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Match is considered{" "}
              <strong className={cfg.text}>
                {data.matchFavorable ? "favourable" : "challenging"}
              </strong>{" "}
              by the Vedic system.
            </span>
          </div>
        </div>
      </div>

      {/* ── Eight Koota cards ───────────────────────────────────────────── */}
      <div>
        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">
          EIGHT KOOTA BREAKDOWN
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KOOTA_META.map((meta) => (
            <KootaCard
              key={meta.key}
              info={data[meta.key] as KootaInfo | null}
              meta={meta}
            />
          ))}
        </div>
      </div>

      {/* ── Disclaimer ──────────────────────────────────────────────────── */}
      <p className="text-[11px] text-muted-foreground text-center leading-relaxed max-w-lg mx-auto">
        Ashtakoot matching is one of many tools in Vedic astrology. We recommend
        using it as a starting point alongside deeper conversation and shared values.
      </p>
    </section>
  );
}
