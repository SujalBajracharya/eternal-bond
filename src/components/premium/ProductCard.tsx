import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmt, type Plan, type PayPerAction } from "@/lib/pricing";

type PlanProps = {
  plan: Plan;
  current?: boolean;
  onSelect?: () => void;
  highlight?: boolean;
};

export function PlanCard({ plan, current, onSelect, highlight }: PlanProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border p-7 flex flex-col bg-card/80 backdrop-blur transition-all",
        highlight
          ? "border-primary/60 shadow-[var(--shadow-card)] scale-[1.02]"
          : "border-border/60 hover:shadow-[var(--shadow-soft)]",
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-sunset px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white shadow-soft flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> {plan.badge}
        </div>
      )}
      <div className="font-[Fraunces] text-xl text-foreground">{plan.name}</div>
      <div className="text-sm text-muted-foreground mt-1 min-h-[2.5rem]">{plan.tagline}</div>

      <div className="mt-5 flex items-baseline gap-2">
        <div className="font-[Fraunces] text-3xl text-foreground">
          {plan.price === 0 ? "Free" : fmt(plan.price)}
        </div>
        {plan.cadence !== "forever" && (
          <div className="text-xs text-muted-foreground">/ {plan.cadence}</div>
        )}
      </div>
      {plan.perMonth && (
        <div className="text-xs text-muted-foreground mt-1">
          ≈ {fmt(plan.perMonth)} / month
        </div>
      )}

      <ul className="mt-6 space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/85">
            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onSelect}
        disabled={current}
        size="lg"
        className={cn(
          "mt-7 w-full rounded-full",
          highlight && !current && "bg-gradient-sunset text-white hover:opacity-90",
        )}
        variant={current ? "outline" : highlight ? "default" : "secondary"}
      >
        {current ? "Your current plan" : plan.cta}
      </Button>
    </div>
  );
}

type ActionProps = {
  action: PayPerAction;
  onBuy?: () => void;
};

export function ProductCard({ action, onBuy }: ActionProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5 flex flex-col hover:shadow-[var(--shadow-soft)] transition-shadow">
      <div className="font-[Fraunces] text-lg text-foreground">{action.title}</div>
      <div className="text-sm text-muted-foreground mt-1 flex-1">{action.description}</div>
      <div className="mt-4 flex items-center justify-between">
        <div className="font-[Fraunces] text-lg text-foreground">{fmt(action.price)}</div>
        <Button size="sm" variant="secondary" className="rounded-full" onClick={onBuy}>
          Buy
        </Button>
      </div>
    </div>
  );
}

export function CompareCell({ value }: { value: string | boolean }) {
  if (value === true)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
        <X className="h-3.5 w-3.5" />
      </span>
    );
  return <span className="text-sm text-foreground/85">{value}</span>;
}
