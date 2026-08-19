import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/useEntitlements";
import { activateProfileBoost } from "@/api/monetization";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const formatDate = (value: number | string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
};

export default function Billing() {
  const { entitlements, loading, error, refresh } = useEntitlements();
  const { session } = useAuth();
  const [activatingBoost, setActivatingBoost] = useState(false);
  const isPremium = entitlements?.premium === true;
  const tier = entitlements?.tier === "premium_yearly"
    ? "Premium Yearly"
    : entitlements?.tier === "premium_monthly"
      ? "Premium Monthly"
      : "Free";
  const activeBoostExpiry = formatDate(entitlements?.profileBoostExpiresAt);
  const availableGrants = (entitlements?.profileBoostGrants ?? []).filter((grant) => grant.available);
  const activeGrants = (entitlements?.profileBoostGrants ?? []).filter((grant) => grant.active);

  const handleActivateBoost = async () => {
    if (!session?.access_token || activatingBoost || entitlements?.profileBoostsAvailable === 0) return;
    setActivatingBoost(true);
    try {
      await activateProfileBoost(session.access_token);
      await refresh();
      toast.success("Profile Boost activated", {
        description: "Your profile is boosted for the next 24 hours.",
      });
    } catch (err: any) {
      toast.error("Could not activate Profile Boost", {
        description: err.message || "Please try again.",
      });
    } finally {
      setActivatingBoost(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-blush">
      <header className="px-6 py-5 max-w-4xl mx-auto flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/settings"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.22em] text-primary-deep">Billing</div>
          <h1 className="font-[Fraunces] text-2xl text-foreground">Your subscription</h1>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full"><Link to="/pricing">See plans</Link></Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-24 space-y-6">
        <section className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-7 relative overflow-hidden">
          {isPremium && <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />}
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Crown className="h-6 w-6" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-[Fraunces] text-2xl text-foreground">{loading ? "Loading…" : tier}</div>
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${isPremium ? "bg-primary/15 text-primary-deep" : "bg-muted text-muted-foreground"}`}>
                  {isPremium ? "active" : "free"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">Your access is verified directly with our billing service.</div>
              {error && <div className="mt-3 text-sm text-destructive">We couldn't load your current subscription. <button className="underline" onClick={refresh}>Try again</button></div>}
              {!isPremium && !loading && <Button asChild size="sm" className="mt-5 rounded-full bg-gradient-sunset text-white hover:opacity-90"><Link to="/pricing">Upgrade to Premium</Link></Button>}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 text-primary" /> Reveal Likes today</div>
            <div className="mt-3 font-[Fraunces] text-2xl text-foreground">{isPremium ? "Unlimited" : `${entitlements?.revealsUsedToday ?? 0} / ${entitlements?.dailyRevealLimit ?? 1}`}</div>
            <Button asChild size="sm" variant="ghost" className="mt-3 rounded-full text-primary-deep"><Link to="/reveal-likes">Go to Reveal Likes →</Link></Button>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4 text-primary" /> Profile Boost</div>
            <div className="mt-3 font-[Fraunces] text-2xl text-foreground">{entitlements?.profileBoostActive ? "Active" : "Available"}</div>
            {activeBoostExpiry && <p className="text-xs text-muted-foreground mt-2">Active until {activeBoostExpiry}</p>}
            {!entitlements?.profileBoostActive && entitlements?.profileBoostsAvailable === 0 && <p className="text-xs text-muted-foreground mt-2">No boosts are available right now.</p>}
            {!entitlements?.profileBoostActive && (entitlements?.profileBoostsAvailable ?? 0) > 0 && (
              <>
                <p className="text-xs text-muted-foreground mt-2">{entitlements.profileBoostsAvailable} available</p>
                <Button size="sm" className="mt-3 rounded-full bg-gradient-sunset text-white" onClick={handleActivateBoost} disabled={activatingBoost}>
                  {activatingBoost && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  {activatingBoost ? "Activating…" : "Activate Boost"}
                </Button>
              </>
            )}
            {availableGrants.length > 0 && (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {availableGrants.map((grant) => (
                  <div key={`${grant.grantType}-${grant.grantPeriod}`}>{grant.grantPeriod || "Current grant"}</div>
                ))}
              </div>
            )}
            {activeGrants.length > 0 && !activeBoostExpiry && <p className="text-xs text-muted-foreground mt-2">Boost active</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Priority Interest</div>
              <div className="mt-1 font-[Fraunces] text-xl text-foreground">{entitlements?.pendingPriorityInterests ?? 0} remaining</div>
            </div>
            <Button asChild variant="ghost" className="rounded-full text-primary-deep"><Link to="/today">Use in Daily Matches</Link></Button>
          </div>
        </section>
      </main>
    </div>
  );
}
