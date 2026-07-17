import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Zap, Receipt as ReceiptIcon, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, fmt } from "@/lib/pricing";
import {
  getSubscription,
  getUsage,
  cancelSubscription,
  resumeSubscription,
  activatePlan,
  setUsage,
  type Subscription,
  type Usage,
} from "@/lib/premium-state";
import { getPurchases, type PurchaseRecord } from "@/lib/purchase-history";
import { formatFullTimestamp } from "@/lib/i18n-receipts";
import { CheckoutDialog } from "@/components/premium/CheckoutDialog";
import { toast } from "sonner";

function daysUntil(ts: number | null) {
  if (!ts) return 0;
  return Math.max(0, Math.ceil((ts - Date.now()) / (24 * 3600 * 1000)));
}

export default function Billing() {
  const [sub, setSub] = useState<Subscription>(getSubscription());
  const [usage, setUsageState] = useState<Usage>(getUsage());
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [boostOpen, setBoostOpen] = useState(false);

  useEffect(() => {
    setPurchases(getPurchases());
    const refresh = () => {
      setSub(getSubscription());
      setUsageState(getUsage());
      setPurchases(getPurchases());
    };
    window.addEventListener("subscription-changed", refresh);
    window.addEventListener("usage-changed", refresh);
    return () => {
      window.removeEventListener("subscription-changed", refresh);
      window.removeEventListener("usage-changed", refresh);
    };
  }, []);

  const currentPlan = PLANS.find((p) => p.id === sub.planId)!;
  const isPremium = sub.planId !== "free";
  const boostActive = usage.boostActiveUntil && usage.boostActiveUntil > Date.now();
  const revealPct = Math.min(100, (usage.revealsUsedToday / usage.revealsLimitToday) * 100);

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
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link to="/pricing">See plans</Link>
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-24 space-y-6">
        {/* Subscription status card */}
        <section className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-7 relative overflow-hidden">
          {isPremium && (
            <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          )}
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Crown className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-[Fraunces] text-2xl text-foreground">{currentPlan.name}</div>
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  sub.status === "active" ? "bg-primary/15 text-primary-deep" : "bg-muted text-muted-foreground"
                }`}>
                  {sub.status}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{currentPlan.tagline}</div>

              {isPremium && sub.renewsAt && (
                <div className="mt-4 text-sm text-foreground/80">
                  {sub.autoRenew ? "Renews" : "Ends"} on{" "}
                  <span className="font-medium">{new Date(sub.renewsAt).toLocaleDateString()}</span>
                  {" "}({daysUntil(sub.renewsAt)} days)
                </div>
              )}

              <div className="mt-5 flex gap-2 flex-wrap">
                {!isPremium && (
                  <Button asChild size="sm" className="rounded-full bg-gradient-sunset text-white hover:opacity-90">
                    <Link to="/pricing">Upgrade to Premium</Link>
                  </Button>
                )}
                {isPremium && sub.autoRenew && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      cancelSubscription();
                      toast("Subscription cancelled", { description: "You'll keep premium until the renewal date." });
                    }}
                  >
                    Cancel renewal
                  </Button>
                )}
                {isPremium && !sub.autoRenew && (
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      resumeSubscription();
                      toast.success("Auto-renewal resumed");
                    }}
                  >
                    Resume auto-renewal
                  </Button>
                )}
                {isPremium && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-muted-foreground"
                    onClick={() => {
                      activatePlan("free");
                      toast("Downgraded to Free");
                    }}
                  >
                    Downgrade to Free
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Usage indicators */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Reveal Likes today
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="font-[Fraunces] text-2xl text-foreground">
                {isPremium ? "Unlimited" : `${usage.revealsUsedToday} / ${usage.revealsLimitToday}`}
              </div>
            </div>
            {!isPremium && (
              <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-sunset transition-all"
                  style={{ width: `${revealPct}%` }}
                />
              </div>
            )}
            <Button asChild size="sm" variant="ghost" className="mt-3 rounded-full text-primary-deep">
              <Link to="/reveal-likes">Go to Reveal Likes →</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" /> Profile Boost
            </div>
            <div className="mt-3 font-[Fraunces] text-2xl text-foreground">
              {boostActive
                ? `${Math.ceil((usage.boostActiveUntil! - Date.now()) / 3600000)}h left`
                : "Not active"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              3× profile views for 24 hours.
            </p>
            <Button
              size="sm"
              className="mt-3 rounded-full bg-gradient-sunset text-white hover:opacity-90"
              onClick={() => setBoostOpen(true)}
              disabled={!!boostActive}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              {boostActive ? "Active" : `Boost for ${fmt(299)}`}
            </Button>
          </div>
        </section>

        {/* Purchase history */}
        <section className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-[Fraunces] text-xl text-foreground">Purchase history</div>
              <div className="text-sm text-muted-foreground">Every receipt, in one place.</div>
            </div>
            {purchases.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/receipts">View all →</Link>
              </Button>
            )}
          </div>
          {purchases.length === 0 ? (
            <div className="mt-6 text-center py-10">
              <ReceiptIcon className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <div className="text-sm text-muted-foreground mt-3">No purchases yet.</div>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-border/50">
              {purchases.slice(0, 5).map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formatFullTimestamp(p.timestamp)}</div>
                  </div>
                  <div className="text-sm text-foreground/80 whitespace-nowrap">{p.price}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <CheckoutDialog
        open={boostOpen}
        onOpenChange={setBoostOpen}
        title="Profile Boost (24 hours)"
        description="3× more profile views for a full day."
        price={299}
        appliesWhen="Boost active for 24 hours starting now."
        receiptLabel="Profile Boost activated"
        onSuccess={() => setUsage({ boostActiveUntil: Date.now() + 24 * 3600 * 1000 })}
      />
    </div>
  );
}
