import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Lock, Heart, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutDialog } from "@/components/premium/CheckoutDialog";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { consumeFreeReveal } from "@/api/monetization";

type Admirer = {
  id: string;
  name: string;
  age: number;
  city: string;
  avatar: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export default function RevealLikes() {
  const {
    entitlements,
    loading: entitlementLoading,
    error: entitlementError,
    refresh: refreshEntitlements,
    consume,
  } = useEntitlements();
  const { session } = useAuth();
  const isPremium = entitlements?.premium === true;

  const [admirers, setAdmirers] = useState<Admirer[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Admirer | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmirers = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/swipes/admirers`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            Accept: "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const mapped: Admirer[] = data.map((item: any) => {
            let age = 25;
            if (item.dateOfBirth) {
              const birthYear = new Date(item.dateOfBirth).getFullYear();
              if (!isNaN(birthYear)) {
                age = new Date().getFullYear() - birthYear;
              }
            }
            return {
              id: item.id,
              name: item.fullName || "Admirer",
              age,
              city: item.location || "Nepal",
              avatar:
                item.avatarUrl ||
                item.photos?.[0] ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
            };
          });
          setAdmirers(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch admirers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmirers();
  }, [session?.access_token]);

  useEffect(() => {
    if (isPremium && admirers.length > 0) {
      setRevealed(new Set(admirers.map((m) => m.id)));
    }
  }, [isPremium, admirers]);

  const doReveal = async (a: Admirer) => {
    if (revealingId) return;
    if (isPremium) {
      setRevealed((r) => new Set(r).add(a.id));
      return;
    }

    if (!session?.access_token) {
      toast.error("Please sign in to reveal an admirer.");
      return;
    }

    if (!entitlements?.canRevealFree && !(entitlements?.pendingRevealLikes ?? 0)) {
      setPending(a);
      return;
    }

    setRevealingId(a.id);
    try {
      if (entitlements.canRevealFree) {
        await consumeFreeReveal(session.access_token);
      } else {
        await consume("reveal_like");
      }
      await refreshEntitlements();
      setRevealed((r) => new Set(r).add(a.id));
      toast.success(`Revealed ${a.name}`, {
        description: isPremium ? "Premium reveal unlocked." : "Reveal confirmed.",
      });
    } catch (err: any) {
      toast.error("Could not reveal this admirer", {
        description: err.message || "Your reveal was not consumed.",
      });
    } finally {
      setRevealingId(null);
    }
  };

  const decide = async (profileId: string, action: "like" | "dislike") => {
    if (!session?.access_token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/swipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profileId: profileId,
          action: action,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const result = await res.json();
      
      setAdmirers((prev) => prev.filter((a) => a.id !== profileId));
      
      if (action === "like" && result.isMatch) {
        toast.success("It's a Match!", {
          description: "You matched with an admirer.",
        });
      } else if (action === "like") {
         toast.success("Liked back!");
      } else {
         toast.success("Passed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to register decision. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-blush">
      <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.22em] text-primary-deep">
            Admirers
          </div>
          <h1 className="font-[Fraunces] text-2xl text-foreground">
            People who liked you
          </h1>
        </div>
        {!isPremium && (
          <Button
            size="sm"
            className="rounded-full bg-gradient-sunset text-white hover:opacity-90 flex items-center gap-1.5"
            onClick={() => setSubscribeOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" /> Unlock all
          </Button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-sm text-muted-foreground text-center max-w-lg mx-auto mb-8">
          {isPremium
            ? "Everyone who has quietly noticed your profile."
            : `${admirers.length} ${admirers.length === 1 ? "person has" : "people have"} liked your profile. Reveal them one at a time, or unlock all with Premium.`}
        </p>

        {entitlementError && (
          <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
            Premium access could not be refreshed. <button className="underline" onClick={refreshEntitlements}>Try again</button>
          </div>
        )}
        {entitlementLoading && !entitlements && (
          <div className="mb-6 text-center text-xs text-muted-foreground">Checking your Premium access…</div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Fetching admirers who liked you...</p>
          </div>
        ) : admirers.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-12 text-center max-w-md mx-auto">
            <Heart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-[Fraunces] text-xl text-foreground">
              No admirers yet
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Keep swiping in Daily Matches to discover people in your area.
              When someone likes your profile, they will appear here!
            </p>
            <Button
              asChild
              className="mt-6 rounded-full bg-gradient-sunset text-white"
            >
              <Link to="/today">Start Swiping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {admirers.map((a) => {
              const isRevealed = revealed.has(a.id);
              return (
                <div
                  key={a.id}
                  className={cn(
                    "group relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/60 bg-card/80 backdrop-blur text-left transition-all",
                    !isRevealed &&
                      "hover:shadow-[var(--shadow-card)]"
                  )}
                >
                  <img
                    src={a.avatar}
                    alt={isRevealed ? a.name : "Hidden admirer"}
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover transition-all",
                      !isRevealed && "blur-2xl scale-110 brightness-90",
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {!isRevealed ? (
                    <button 
                      className="absolute inset-0 w-full h-full text-left cursor-pointer z-10"
                      onClick={() => doReveal(a)}
                      disabled={!!revealingId}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3 text-center">
                        <div className="h-11 w-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div className="text-xs uppercase tracking-wider font-medium flex items-center gap-2">
                          {revealingId === a.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {revealingId === a.id ? "Revealing…" : "Tap to reveal"}
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <div className="text-xs opacity-80 flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-white" /> Liked your
                          profile
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10 flex flex-col gap-2">
                      <div>
                        <div className="font-[Fraunces] text-lg leading-tight">
                          {a.name}, {a.age}
                        </div>
                        <div className="text-xs opacity-80">{a.city}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Button 
                          variant="default"
                          size="sm"
                          className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium"
                          onClick={() => decide(a.id, "like")}
                        >
                          Like Back
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="h-8 text-xs bg-black/20 hover:bg-black/40 text-white border-white/30 rounded-full font-medium backdrop-blur-sm"
                          onClick={() => decide(a.id, "dislike")}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="col-span-2 h-8 text-xs rounded-full bg-black/30 hover:bg-black/50 text-white font-medium backdrop-blur-sm border border-white/10"
                          onClick={() => navigate(`/profile/${a.id}`)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isPremium && admirers.length > 0 && (
          <div className="mt-12 rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-8 text-center max-w-xl mx-auto">
            <Eye className="h-6 w-6 text-primary-deep mx-auto mb-3" />
            <div className="font-[Fraunces] text-xl text-foreground">
              See everyone at once
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Premium reveals every admirer, past and future — without spending
              per person.
            </p>
            <Button
              asChild
              className="mt-5 rounded-full bg-gradient-sunset text-white hover:opacity-90"
            >
              <Link to="/pricing">Explore Premium</Link>
            </Button>
          </div>
        )}
      </main>

      {pending && (
        <CheckoutDialog
          open={!!pending}
          onOpenChange={(o) => !o && setPending(null)}
          title={`Reveal ${pending.name}`}
          description="See who liked you — one gentle, one-time reveal."
          price={99}
          appliesWhen="Revealed immediately in your Likes tab."
          receiptLabel={`Revealed ${pending.name}`}
          productId="reveal-like"
        />
      )}

      {subscribeOpen && (
        <CheckoutDialog
          open={subscribeOpen}
          onOpenChange={setSubscribeOpen}
          title="Subscribe to Premium"
          description="Unlimited reveals plus every premium feature."
          price={1499}
          cadence="month"
          appliesWhen="Renews monthly. Cancel anytime."
          receiptLabel="Premium activated"
          productId="premium_monthly"
        />
      )}
    </div>
  );
}
