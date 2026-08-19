import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Heart,
  Compass,
  ChevronRight,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Sunrise,
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  Lock,
  Loader2,
  Landmark,
  Languages,
  BadgeCheck,
  Wallet,
  Tag,
  Flag,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import HeartMascot from "@/components/matches/HeartMascot";
import MatchCelebration from "@/components/matches/MatchCelebration";
import { CheckoutDialog } from "@/components/premium/CheckoutDialog";
import { useAuth } from "@/hooks/use-auth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReportPhotoDialog from "@/components/ReportPhotoDialog";
import NavbarAuthenticated from "@/components/userSide/NavbarAuthenticated";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";
import { FullProfileData } from "@/components/matches/FullProfileDialog";

type GalleryItem = { url: string; blurred?: boolean };

type DetailItem = { icon: any; label: string; value: string };

type Match = {
  id: string;
  name: string;
  age: number;
  mood: string;
  photo: string;
  blurred?: boolean;
  gallery: GalleryItem[];
  highlights: { icon: any; label: string }[];
  about: string;
  family: string;
  details: DetailItem[];
  interests: string[];
  location: string;
  verified: boolean;
  mutual?: boolean;
  priorityBadge?: boolean;
};

type Decision = "interested" | "skipped";

const calculateAge = (dobString: string | null) => {
  if (!dobString) return 28;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 28;
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const getHighlights = (dto: any) => {
  const list = [];
  if (dto.profession) {
    list.push({ icon: Briefcase, label: dto.profession });
  }
  if (dto.location) {
    list.push({ icon: MapPin, label: dto.location });
  }
  if (dto.familyType) {
    list.push({
      icon: Users,
      label: `${dto.familyType.charAt(0).toUpperCase() + dto.familyType.slice(1)} family`,
    });
  } else if (dto.fatherOccupation || dto.motherOccupation) {
    list.push({ icon: Users, label: "Nuclear family" });
  }
  if (dto.highestEducation) {
    list.push({ icon: GraduationCap, label: dto.highestEducation });
  }
  return list;
};

// Personal facts (religion, mother tongue, marital status, income) are
// presented as a quiet key/value list rather than tags — these are
// background context, not things to "match" on visually.
const getDetails = (dto: any): DetailItem[] => {
  const details: DetailItem[] = [];
  if (dto.religion)
    details.push({ icon: Landmark, label: "Religion", value: dto.religion });
  if (dto.motherTongue)
    details.push({
      icon: Languages,
      label: "Mother tongue",
      value: dto.motherTongue,
    });
  if (dto.maritalStatus)
    details.push({
      icon: BadgeCheck,
      label: "Marital status",
      value: dto.maritalStatus,
    });
  if (dto.incomeRange)
    details.push({
      icon: Wallet,
      label: "Income range",
      value: dto.incomeRange,
    });
  return details;
};

const getFamilyDetails = (dto: any) => {
  const parts = [];
  if (dto.familyType) parts.push(`Family Type: ${dto.familyType}`);
  if (dto.fatherOccupation)
    parts.push(`Father's Occupation: ${dto.fatherOccupation}`);
  if (dto.motherOccupation)
    parts.push(`Mother's Occupation: ${dto.motherOccupation}`);
  if (dto.siblings) parts.push(`Siblings: ${dto.siblings}`);
  return parts.length > 0 ? parts.join(". ") + "." : "Details not provided.";
};

const DailyMatches = () => {
  const { session } = useAuth();
  const {
    entitlements,
    consume,
    refresh: refreshEntitlements,
  } = useEntitlements();
  const [matches, setMatches] = useState<Match[]>([]);
  const [myInterests, setMyInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [lastSkippedIndex, setLastSkippedIndex] = useState<number | null>(null);
  const [undoCheckoutOpen, setUndoCheckoutOpen] = useState(false);
  const [checkoutIntent, setCheckoutIntent] = useState<
    "undo_skip" | "extra_like"
  >("undo_skip");
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<Decision | null>(null);
  const navigate = useNavigate();
  const [animKey, setAnimKey] = useState(0);
  const [mascotState, setMascotState] = useState<"idle" | "wink" | "beat">(
    "idle",
  );
  const [burst, setBurst] = useState(false);
  const [celebrate, setCelebrate] = useState<Match | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [reportPhotoUrl, setReportPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Today's Matches — EternalBond";
    const desc =
      "Five thoughtfully chosen introductions, reviewed one at a time. A calm, intentional way to find a partner.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  useEffect(() => {
    const fetchDailyMatches = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

        const [res, meRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/profiles/daily`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              Accept: "application/json",
            },
          }),
          fetch(`${API_BASE_URL}/api/profiles/me`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              Accept: "application/json",
            },
          }).catch(() => null),
        ]);

        if (!res.ok) {
          throw new Error("Failed to fetch daily matches");
        }
        const data = await res.json();

        let myProfileId: string | null = null;
        if (meRes && meRes.ok) {
          const me = await meRes.json();
          myProfileId = me.id ?? me.profileId ?? session.user?.id ?? null;
        } else {
          myProfileId = session.user?.id ?? null;
        }

        const profileIds = data.map((d: any) => d.id);
        const allProfileIdsForInterests = myProfileId
          ? [...profileIds, myProfileId]
          : profileIds;

        let photoVisibilities: Record<string, string> = {};
        let interestsByProfile: Record<string, string[]> = {};

        if (profileIds.length > 0) {
          const { data: photoRows } = await supabase
            .from("profile_photos_mapping")
            .select("photo_url, visibility")
            .in("profile_id", profileIds);

          if (photoRows) {
            photoRows.forEach((row) => {
              photoVisibilities[row.photo_url] = row.visibility || "visible";
            });
          }
        }

        if (allProfileIdsForInterests.length > 0) {
          const { data: interestRows, error: interestErr } = (await supabase
            .from("profile_interests" as any)
            .select("profile_id, interest")
            .in("profile_id", allProfileIdsForInterests)) as any;

          if (interestErr) {
            console.error(interestErr);
          } else if (interestRows) {
            interestRows.forEach((row) => {
              if (!interestsByProfile[row.profile_id]) {
                interestsByProfile[row.profile_id] = [];
              }
              interestsByProfile[row.profile_id].push(row.interest);
            });
          }
        }

        if (myProfileId) {
          setMyInterests(interestsByProfile[myProfileId] || []);
        }

        const mapped: Match[] = data.map((dto: any) => {
          const mainPhoto =
            dto.photos && dto.photos.length > 0
              ? dto.photos[0]
              : dto.avatarUrl || "";
          const gallery = (dto.photos || []).map((url: string) => ({
            url,
            blurred: photoVisibilities[url] === "blurred",
          }));

          if (gallery.length === 0 && mainPhoto) {
            gallery.push({ url: mainPhoto, blurred: false });
          }

          return {
            id: dto.id,
            name: dto.fullName || "Anonymous",
            age: calculateAge(dto.dateOfBirth),
            mood: dto.profession
              ? `${dto.profession} based in ${dto.location || "India"}`
              : "Looking for a lifetime connection",
            photo: mainPhoto,
            blurred: gallery[0]?.blurred || false,
            gallery,
            highlights: getHighlights(dto),
            about: dto.bio || "No bio details provided yet.",
            family: getFamilyDetails(dto),
            details: getDetails(dto),
            interests: interestsByProfile[dto.id] || [],
            location: dto.location || "India",
            verified: dto.kycStatus === "verified",
            priorityBadge: dto.priorityBadge === true,
          };
        });

        setMatches(mapped);
      } catch (err: any) {
        console.error(err);
        toast.error("Could not load daily recommendations.");
      } finally {
        setLoading(false);
      }
    };

    fetchDailyMatches();
  }, [session]);

  const total = matches.length;
  const current = matches[index];
  const done = index >= total;
  const interestedCount = useMemo(
    () => Object.values(decisions).filter((d) => d === "interested").length,
    [decisions],
  );

  const commonInterests = useMemo(() => {
    if (!current) return [];
    const mine = new Set(myInterests.map((i) => i.toLowerCase()));
    return current.interests.filter((i) => mine.has(i.toLowerCase()));
  }, [current, myInterests]);

  const otherInterests = useMemo(() => {
    if (!current) return [];
    const commonLower = new Set(commonInterests.map((i) => i.toLowerCase()));
    return current.interests.filter((i) => !commonLower.has(i.toLowerCase()));
  }, [current, commonInterests]);

  const advance = () => {
    setFeedback(null);
    setExpanded(false);
    setBurst(false);
    setMascotState("idle");
    setGalleryIdx(0);
    setIndex((i) => i + 1);
    setAnimKey((k) => k + 1);
  };

  const decide = async (d: Decision) => {
    if (!current || !session?.access_token) return;
    setFeedback(d);

    if (d === "skipped") {
      setLastSkippedIndex(index);
    } else {
      setLastSkippedIndex(null);
    }

    if (d === "interested") {
      setBurst(true);
      setMascotState("beat");
    }

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
      const res = await fetch(`${API_BASE_URL}/api/swipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profileId: current.id,
          action: d === "interested" ? "like" : "dislike",
        }),
      });

      if (!res.ok) {
        // Handle daily like limit exceeded — offer to purchase an extra like
        if (res.status === 429 && d === "interested") {
          setFeedback(null);
          setBurst(false);
          setMascotState("idle");
          toast.error("Daily like limit reached", {
            description: "Purchase an extra like to continue.",
          });
          setCheckoutIntent("extra_like");
          setUndoCheckoutOpen(true);
          return;
        }
        throw new Error(`Server error: ${res.status}`);
      }

      const result = await res.json();
      setDecisions((prev) => ({ ...prev, [current.id]: d }));

      if (d === "interested" && result.isMatch) {
        setTimeout(() => {
          setCelebrate(current);
          setFeedback(null);
        }, 900);
        return;
      }
    } catch (err) {
      console.error(err);
      // Reset optimistic UI state so the card doesn't stay broken
      setFeedback(null);
      setBurst(false);
      setMascotState("idle");
      toast.error("Failed to register decision. Please try again.");
      return;
    }

    setTimeout(advance, 700);
  };

  const performUndo = async (skippedIdx: number) => {
    try {
      const skippedMatch = matches[skippedIdx];
      if (skippedMatch) {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

        const res = await fetch(
          `${API_BASE_URL}/api/swipes/${skippedMatch.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        if (!entitlements?.premium) {
          await consume("undo_skip");
        }

        setDecisions((prev) => {
          const next = { ...prev };
          delete next[skippedMatch.id];
          return next;
        });
      }
      setIndex(skippedIdx);
      setLastSkippedIndex(null);
      setFeedback(null);
      setExpanded(false);
      setGalleryIdx(0);
      setAnimKey((k) => k + 1);
      sessionStorage.removeItem("eb_pending_undo_profile_id");
      toast.success("Skip undone!", {
        description: "You are back on the previous profile.",
      });
    } catch (err: any) {
      console.error("Failed to undo skip:", err);
      toast.error("Could not undo skip. Please try again.");
    }
  };

  const handleUndoSkip = async () => {
    if (lastSkippedIndex === null) return;

    const canUndo = entitlements?.canUndoSkip || entitlements?.premium;
    const hasPendingUndo = (entitlements?.pendingUndoSkips ?? 0) > 0;

    if (!canUndo && !hasPendingUndo) {
      // Save skipped profile ID before Stripe redirect destroys state
      const skippedMatch = matches[lastSkippedIndex];
      if (skippedMatch) {
        sessionStorage.setItem("eb_pending_undo_profile_id", skippedMatch.id);
      }
      setCheckoutIntent("undo_skip");
      setUndoCheckoutOpen(true);
      return;
    }

    await performUndo(lastSkippedIndex);
  };

  // After returning from Stripe, auto-restore the skipped profile when
  // the entitlement is granted and matches are loaded.
  useEffect(() => {
    const pendingId = sessionStorage.getItem("eb_pending_undo_profile_id");
    if (!pendingId || matches.length === 0) return;
    const hasPendingUndo = (entitlements?.pendingUndoSkips ?? 0) > 0;
    const canUndo =
      entitlements?.canUndoSkip || entitlements?.premium || hasPendingUndo;
    if (!canUndo) return;

    const idx = matches.findIndex((m) => m.id === pendingId);
    if (idx === -1) return;

    // Small delay so the page settles before restoring
    const t = setTimeout(() => performUndo(idx), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, entitlements]);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const heroPhoto = current
    ? current.gallery[Math.min(galleryIdx, current.gallery.length - 1)]
    : null;

  const fullProfile: FullProfileData | null = current
    ? {
        id: current.id,
        name: current.name,
        age: current.age,
        mood: current.mood,
        about: current.about,
        family: current.family,
        values: current.details.map((d) => d.value),
        location: current.location,
        verified: current.verified,
        highlights: current.highlights,
        gallery: current.gallery,
      }
    : null;

  return (
    <>
      <NavbarAuthenticated />
      <main className="min-h-screen bg-background relative overflow-x-hidden">
        {loading ? (
          <div className="min-h-[80vh] flex flex-col justify-center items-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground mt-4 font-serif text-lg">
              Finding today's matches for you...
            </p>
          </div>
        ) : (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
            >
              <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-radial-glow opacity-70" />
              <div className="absolute top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-radial-glow opacity-50" />
            </div>

            <section className="max-w-6xl mx-auto px-6 pt-10 pb-24">
              <div className="grid md:grid-cols-12 gap-6 mb-10">
                <div className="md:col-span-7">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Sunrise className="h-4 w-4 text-accent" />
                    {greet()}
                  </div>
                  <h1 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">
                    Your matches{" "}
                    <span className="text-gradient-sunset">for today</span>
                  </h1>
                  <p className="mt-3 text-muted-foreground max-w-md">
                    Five introductions, hand-picked. Take a moment to review
                    thoughtfully — there is no rush, and no endless feed.
                  </p>
                </div>
                <div className="md:col-span-5 flex md:justify-end">
                  <div className="w-full md:w-72 flex flex-col gap-3">
                    <div className="flex justify-end">
                      <Link
                        to="/filters"
                        className="group relative flex h-10 items-center overflow-hidden rounded-full"
                      >
                        {/* Glow */}
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 transition-all duration-500 group-hover:opacity-100" />

                        {/* Expanding Pill */}
                        <div className="relative flex h-10 w-10 items-center rounded-full border border-border/60 bg-card/70 backdrop-blur-xl transition-all duration-500 ease-out group-hover:w-44 group-hover:border-primary/40 group-hover:shadow-soft">
                          {/* Icon */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                            <Compass className="h-4 w-4 transition-all duration-500 group-hover:rotate-[25deg] group-hover:scale-110" />
                          </div>

                          {/* Text */}
                          <span className="pointer-events-none whitespace-nowrap text-sm font-medium opacity-0 -translate-x-3 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                            Match Compass
                          </span>
                        </div>
                      </Link>
                    </div>

                    {/* Progress Card */}
                    <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-5 shadow-soft">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Today's progress</span>
                        <span className="tabular-nums">
                          {Math.min(index, total)} of {total}
                        </span>
                      </div>

                      <div className="mt-3 flex gap-1.5">
                        {matches.map((m, i) => {
                          const state = decisions[m.id];
                          const active = i === index;

                          return (
                            <div
                              key={m.id}
                              className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted"
                            >
                              <div
                                className={cn(
                                  "h-full transition-all duration-500",
                                  state === "interested" && "bg-primary",
                                  state === "skipped" &&
                                    "bg-muted-foreground/40",
                                  !state && active && "bg-accent w-1/3",
                                  !state && !active && "w-0",
                                  state && "w-full",
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Heart className="h-3.5 w-3.5 text-primary" />
                        {interestedCount} marked interested
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!done && current && heroPhoto ? (
                <div
                  key={animKey}
                  className="grid md:grid-cols-12 gap-8 animate-fade-in"
                >
                  {/* Photo column with inline gallery */}
                  <div className="md:col-span-7 relative">
                    <div className="relative rounded-[2rem] overflow-hidden shadow-card bg-muted aspect-[4/5]">
                      <img
                        src={heroPhoto.url}
                        alt={`Portrait of ${current.name}`}
                        width={768}
                        height={960}
                        loading="lazy"
                        className={cn(
                          "h-full w-full object-cover transition-all duration-700",
                          heroPhoto.blurred && "blur-2xl scale-110",
                        )}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />

                      <div className="absolute top-5 left-5 flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur text-xs font-medium">
                          {index + 1} of {total}
                        </span>
                        {current.verified && (
                          <span className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur text-xs font-medium inline-flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-sage" />{" "}
                            Verified
                          </span>
                        )}
                        {current.priorityBadge && (
                          <span className="px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium inline-flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> Priority
                          </span>
                        )}
                      </div>

                      {session?.user?.id !== current.id && (
                        <div className="absolute top-5 right-5 z-10">
                          <button
                            type="button"
                            onClick={() => setReportPhotoUrl(heroPhoto.url)}
                            className="p-2 rounded-full bg-background/90 backdrop-blur hover:bg-background transition-colors text-rose-500 hover:text-rose-600 shadow-sm"
                            title="Report Photo"
                          >
                            <Flag className="h-4 w-4 fill-rose-500" />
                          </button>
                        </div>
                      )}

                      {heroPhoto.blurred && (
                        <div className="absolute inset-0 grid place-items-center pointer-events-none">
                          <div className="rounded-2xl bg-background/85 backdrop-blur px-4 py-2.5 text-xs flex items-center gap-2 shadow-soft">
                            <Lock className="h-3.5 w-3.5 text-primary-deep" />
                            Private — revealed when mutual
                          </div>
                        </div>
                      )}

                      {/* Gallery dots */}
                      {current.gallery.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                          {current.gallery.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setGalleryIdx(i)}
                              className={cn(
                                "h-1.5 rounded-full transition-all",
                                i === galleryIdx
                                  ? "w-8 bg-background"
                                  : "w-1.5 bg-background/60 hover:bg-background/80",
                              )}
                              aria-label={`Photo ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {current.gallery.length > 1 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                        {current.gallery.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setGalleryIdx(i)}
                            className={cn(
                              "relative h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                              i === galleryIdx
                                ? "border-primary shadow-soft"
                                : "border-transparent opacity-70 hover:opacity-100",
                            )}
                            aria-label={`View photo ${i + 1}`}
                          >
                            <img
                              src={p.url}
                              alt=""
                              className={cn(
                                "w-full h-full object-cover",
                                p.blurred && "blur-md scale-110",
                              )}
                            />
                            {p.blurred && (
                              <span className="absolute inset-0 grid place-items-center bg-background/20">
                                <Lock className="h-3.5 w-3.5 text-foreground" />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      aria-hidden
                      className="hidden md:block absolute -bottom-6 -right-6 h-32 w-32 rounded-3xl bg-gradient-blush border border-border/60 -z-0"
                    />
                  </div>

                  {/* Details column */}
                  <div className="md:col-span-5 flex flex-col">
                    <div className="flex items-baseline gap-3">
                      <h2 className="font-serif text-3xl">{current.name}</h2>
                      <span className="text-muted-foreground">
                        · {current.age}
                      </span>
                    </div>
                    <p className="mt-2 text-foreground/80 italic">
                      "{current.mood}"
                    </p>

                    <ul className="mt-6 space-y-3">
                      {current.highlights.map((h, i) => {
                        const Icon = h.icon;
                        return (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm"
                          >
                            <span className="mt-0.5 h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 text-primary-deep" />
                            </span>
                            <span className="text-foreground/85 leading-relaxed">
                              {h.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Interests — the only thing rendered as tags, so common
                      ground stands out at a glance */}
                    {current.interests.length > 0 && (
                      <div className="mt-6">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" />
                          Interests
                          {commonInterests.length > 0 && (
                            <span className="text-primary-deep font-medium">
                              · {commonInterests.length} in common
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {commonInterests.map((interest) => (
                            <span
                              key={interest}
                              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium bg-gradient-sunset text-primary-foreground shadow-soft"
                            >
                              <Sparkles className="h-3 w-3" />
                              {interest}
                            </span>
                          ))}
                          {otherInterests.map((interest) => (
                            <span
                              key={interest}
                              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-secondary/60 text-foreground/80 border border-border/60"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setExpanded((e) => !e)}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-deep hover:gap-2 transition-all w-fit"
                    >
                      {expanded ? "Show less" : "A little more about them"}
                      {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {expanded && (
                      <div className="mt-4 space-y-5 animate-fade-in">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                            In their words
                          </div>
                          <p className="text-sm text-foreground/85 leading-relaxed">
                            {current.about}
                          </p>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                            Family
                          </div>
                          <p className="text-sm text-foreground/85 leading-relaxed">
                            {current.family}
                          </p>
                        </div>

                        {/* Background details — deliberately NOT tags, so they
                          read as quiet facts rather than things to compare */}
                        {current.details.length > 0 && (
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                              Good to know
                            </div>
                            <div className="rounded-xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                              {current.details.map((d, i) => {
                                const Icon = d.icon;
                                return (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                                  >
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                      <Icon className="h-3.5 w-3.5" />
                                      {d.label}
                                    </span>
                                    <span className="text-foreground/85 font-medium text-right">
                                      {d.value}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto pt-8">
                      <div className="flex flex-col gap-3">
                        {/* Interested — with mascot, hover wink, click burst */}
                        <button
                          onClick={() => decide("interested")}
                          onMouseEnter={() =>
                            mascotState !== "beat" && setMascotState("wink")
                          }
                          onMouseLeave={() =>
                            mascotState !== "beat" && setMascotState("idle")
                          }
                          className={cn(
                            "group relative overflow-hidden h-14 rounded-full px-6 font-medium text-primary-foreground",
                            "bg-gradient-sunset shadow-soft hover:shadow-glow",
                            "transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0",
                            "ring-2 ring-transparent hover:ring-primary/30",
                          )}
                        >
                          {/* Shimmer */}
                          <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent,hsl(0_0%_100%/0.35),transparent)] bg-[length:200%_100%] animate-shimmer opacity-60" />

                          <span className="relative flex items-center justify-center gap-3 text-base">
                            <HeartMascot
                              state={mascotState}
                              className="transition-transform group-hover:rotate-[-6deg]"
                            />
                            <span>I'm interested</span>
                            <HeartMascot
                              state={mascotState === "beat" ? "beat" : "idle"}
                            />
                          </span>

                          {/* Burst hearts */}
                          {burst && (
                            <span
                              aria-hidden
                              className="absolute inset-0 pointer-events-none"
                            >
                              {Array.from({ length: 8 }).map((_, i) => {
                                const angle = (i / 8) * Math.PI * 2;
                                const x = Math.cos(angle) * 60;
                                const y = Math.sin(angle) * 30;
                                return (
                                  <Heart
                                    key={i}
                                    className="absolute left-1/2 top-1/2 h-4 w-4 text-primary-foreground fill-primary-foreground animate-heart-burst"
                                    style={{
                                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                      animationDelay: `${i * 30}ms`,
                                    }}
                                  />
                                );
                              })}
                            </span>
                          )}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => decide("skipped")}
                            className={cn(
                              "group h-12 rounded-full border border-border bg-card hover:bg-secondary/60",
                              "text-sm font-medium transition-all duration-300 hover:-translate-y-0.5",
                              "flex items-center justify-center gap-2",
                            )}
                          >
                            <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
                            Not this time
                          </button>
                          <button
                            onClick={() => {
                              if (current?.id)
                                navigate(`/profile/${current.id}`);
                            }}
                            className={cn(
                              "group h-12 rounded-full bg-secondary/40 hover:bg-secondary",
                              "text-sm font-medium transition-all duration-300 hover:-translate-y-0.5",
                              "flex items-center justify-center gap-2 text-foreground",
                            )}
                          >
                            View full profile
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>

                        {/* Undo skip button */}
                        {lastSkippedIndex !== null && (
                          <button
                            onClick={handleUndoSkip}
                            className="w-full h-10 rounded-full border border-border/80 bg-card/60 hover:bg-secondary/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
                          >
                            <Undo2 className="h-3.5 w-3.5 text-primary-deep" />
                            Undo previous skip
                            {!entitlements?.premium && (
                              <span className="text-[10px] bg-primary/10 text-primary-deep px-2 py-0.5 rounded-full font-sans">
                                {(entitlements?.pendingUndoSkips ?? 0) > 0
                                  ? `${entitlements?.pendingUndoSkips} left`
                                  : "Single Use"}
                              </span>
                            )}
                          </button>
                        )}

                        <p className="text-[11px] text-muted-foreground text-center pt-1">
                          Take your time. Decisions stay private until matched.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 animate-fade-in">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-sunset shadow-glow mb-6">
                    <Sparkles className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h2 className="font-serif text-4xl">That's all for today</h2>
                  <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                    You marked{" "}
                    <span className="text-foreground font-medium">
                      {interestedCount}
                    </span>{" "}
                    introduction{interestedCount === 1 ? "" : "s"} as
                    interesting. We'll let you know if any feeling is mutual.
                    Five new matches arrive tomorrow morning.
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-3">
                    {lastSkippedIndex !== null && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full"
                        onClick={handleUndoSkip}
                      >
                        <Undo2 className="h-4 w-4 mr-2 text-primary-deep" />
                        Undo last skip
                      </Button>
                    )}
                    <Button asChild className="rounded-full" size="lg">
                      <Link to="/">Return home</Link>
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* Subtle skip/interest feedback toast */}
        {feedback && !celebrate && (
          <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
            <div className="px-6 py-4 rounded-2xl shadow-glow backdrop-blur bg-background/90 border border-border/70 animate-scale-in flex items-center gap-3">
              {feedback === "interested" ? (
                <>
                  <Heart className="h-5 w-5 text-primary fill-primary" />
                  <span className="font-medium">Interest noted, gently.</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Skipped. On to the next.</span>
                </>
              )}
            </div>
          </div>
        )}

        {celebrate && (
          <MatchCelebration
            name={celebrate.name}
            photo={
              celebrate.gallery.find((g) => !g.blurred)?.url ?? celebrate.photo
            }
            onClose={() => {
              setCelebrate(null);
              advance();
            }}
          />
        )}
        {current && (
          <ReportPhotoDialog
            open={!!reportPhotoUrl}
            onOpenChange={(open) => !open && setReportPhotoUrl(null)}
            photoUrl={reportPhotoUrl || ""}
            reportedUserId={current.id}
          />
        )}

        <CheckoutDialog
          open={undoCheckoutOpen}
          onOpenChange={setUndoCheckoutOpen}
          productId={
            checkoutIntent === "extra_like" ? "extra-likes" : "undo_skip"
          }
          title={
            checkoutIntent === "extra_like" ? "Buy an extra like" : "Undo Skip"
          }
          description={
            checkoutIntent === "extra_like"
              ? "You've used today's likes. Purchase one extra like to express interest in this profile."
              : "Pay once to bring back the profile you just skipped. You'll be returned here automatically after checkout and the profile will be restored."
          }
          price={80}
          appliesWhen={
            checkoutIntent === "extra_like"
              ? "Applied immediately — like this profile right away."
              : "Profile is restored instantly after successful payment."
          }
          receiptLabel={
            checkoutIntent === "extra_like"
              ? "Extra Like purchased"
              : "Undo Skip purchased"
          }
        />

        <ScrollToTopButton />
      </main>
    </>
  );
};

export default DailyMatches;
