import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCard, ProductCard, CompareCell } from "@/components/premium/ProductCard";
import { CheckoutDialog } from "@/components/premium/CheckoutDialog";
import { PLANS, PAY_PER_ACTION, COMPARE_ROWS, type Plan, type PayPerAction } from "@/lib/pricing";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function Pricing() {
  const { entitlements } = useEntitlements();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedAction, setSelectedAction] = useState<PayPerAction | null>(null);

  return (
    <div className="min-h-screen bg-gradient-blush">
      <header className="px-6 py-5 max-w-6xl mx-auto flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.22em] text-primary-deep">Premium</div>
          <h1 className="font-[Fraunces] text-2xl text-foreground">Choose what feels right</h1>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link to="/billing">Billing</Link>
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-[Fraunces] text-3xl sm:text-4xl text-foreground leading-tight">
            Small, meaningful upgrades — never a paywall on love.
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            All prices in Nepalese Rupees. Cancel any subscription anytime.
          </p>
        </div>

        {/* Plans */}
        <section className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              current={plan.id === "free" ? !entitlements?.premium : entitlements?.premium && entitlements.tier === plan.id}
              highlight={plan.id === "premium_monthly"}
              onSelect={() => setSelectedPlan(plan)}
            />
          ))}
        </section>

        {/* Comparison Table */}
        <section className="mt-16">
          <h3 className="font-[Fraunces] text-2xl text-foreground text-center">Compare</h3>
          <p className="text-sm text-muted-foreground text-center mt-1">Every feature, side by side.</p>
          <div className="mt-8 overflow-x-auto rounded-3xl border border-border/60 bg-card/60 backdrop-blur">
            <table className="w-full text-left min-w-[560px]">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="p-4 text-xs uppercase tracking-wider text-muted-foreground font-normal">Feature</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-muted-foreground font-normal text-center">Free</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-muted-foreground font-normal text-center">Pay per use</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-primary-deep font-medium text-center">Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/40 last:border-0">
                    <td className="p-4 text-sm text-foreground">{row.label}</td>
                    <td className="p-4 text-center"><CompareCell value={row.free} /></td>
                    <td className="p-4 text-center"><CompareCell value={row.ppa} /></td>
                    <td className="p-4 text-center bg-primary/[0.03]"><CompareCell value={row.premium} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pay per action */}
        <section className="mt-16">
          <h3 className="font-[Fraunces] text-2xl text-foreground text-center">Or pay only when you need it</h3>
          <p className="text-sm text-muted-foreground text-center mt-1">No subscription. One-time gentle upgrades.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PAY_PER_ACTION.map((a) => (
              <ProductCard key={a.id} action={a} onBuy={() => setSelectedAction(a)} />
            ))}
          </div>
        </section>

        {/* FAQ / trust */}
        <section className="mt-16 rounded-3xl border border-border/60 bg-card/60 backdrop-blur p-8 text-center max-w-2xl mx-auto">
          <HelpCircle className="h-6 w-6 text-primary-deep mx-auto mb-3" />
          <div className="font-[Fraunces] text-lg text-foreground">Questions about billing?</div>
          <p className="text-sm text-muted-foreground mt-2">
            All payments are handled securely. You can cancel a subscription in one tap from your <Link to="/billing" className="text-primary underline underline-offset-2">Billing page</Link>. Refunds available within 7 days.
          </p>
        </section>
      </main>

      {selectedPlan && (
        <CheckoutDialog
          productId={selectedPlan.id}
          open={!!selectedPlan}
          onOpenChange={(o) => !o && setSelectedPlan(null)}
          title={`Subscribe to ${selectedPlan.name}`}
          description={selectedPlan.tagline}
          price={selectedPlan.price}
          cadence={selectedPlan.cadence === "forever" ? undefined : selectedPlan.cadence}
          appliesWhen={
            selectedPlan.cadence === "year"
              ? "Renews yearly. Cancel anytime."
              : "Renews monthly. Cancel anytime."
          }
          receiptLabel={`${selectedPlan.name} activated`}
        />
      )}

      {selectedAction && (
        <CheckoutDialog
          productId={selectedAction.id}
          open={!!selectedAction}
          onOpenChange={(o) => !o && setSelectedAction(null)}
          title={selectedAction.title}
          description={selectedAction.description}
          price={selectedAction.price}
          appliesWhen={selectedAction.appliesWhen}
          receiptLabel={selectedAction.title}
        />
      )}
    </div>
  );
}
