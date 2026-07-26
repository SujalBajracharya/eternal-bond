import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function Billing() {
  const { entitlements, loading, error, refresh } = useEntitlements();
  const isPremium = entitlements?.premium === true;
  const tier = entitlements?.tier === "premium_yearly" ? "Premium (Yearly)" : isPremium ? "Premium" : "Free";

  return (
    <div className="min-h-screen bg-gradient-blush">
      <header className="px-6 py-5 max-w-4xl mx-auto flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full"><Link to="/settings"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="flex-1"><div className="text-[11px] uppercase tracking-[0.22em] text-primary-deep">Billing</div><h1 className="font-[Fraunces] text-2xl text-foreground">Your subscription</h1></div>
        <Button asChild variant="ghost" size="sm" className="rounded-full"><Link to="/pricing">See plans</Link></Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-24 space-y-6">
        <section className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-7 relative overflow-hidden">
          {isPremium && <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />}
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Crown className="h-6 w-6" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><div className="font-[Fraunces] text-2xl text-foreground">{loading ? "Loading…" : tier}</div><span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${isPremium ? "bg-primary/15 text-primary-deep" : "bg-muted text-muted-foreground"}`}>{isPremium ? "active" : "free"}</span></div>
              <div className="text-sm text-muted-foreground mt-1">Your access is verified directly with our billing service.</div>
              {error && <div className="mt-3 text-sm text-destructive">We couldn't load your current subscription. <button className="underline" onClick={refresh}>Try again</button></div>}
              {!isPremium && !loading && <Button asChild size="sm" className="mt-5 rounded-full bg-gradient-sunset text-white hover:opacity-90"><Link to="/pricing">Upgrade to Premium</Link></Button>}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 text-primary" /> Reveal Likes today</div><div className="mt-3 font-[Fraunces] text-2xl text-foreground">{isPremium ? "Unlimited" : `${entitlements?.revealsUsedToday ?? 0} / ${entitlements?.dailyRevealLimit ?? 1}`}</div><Button asChild size="sm" variant="ghost" className="mt-3 rounded-full text-primary-deep"><Link to="/reveal-likes">Go to Reveal Likes →</Link></Button></div>
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5"><div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4 text-primary" /> Profile Boost</div><div className="mt-3 font-[Fraunces] text-2xl text-foreground">{entitlements?.profileBoostActive ? "Active" : "Not active"}</div><p className="text-xs text-muted-foreground mt-2">Boost availability is updated after payment is verified.</p><Button asChild size="sm" variant="ghost" className="mt-3 rounded-full text-primary-deep"><Link to="/pricing">View upgrades →</Link></Button></div>
        </section>
      </main>
    </div>
  );
}
