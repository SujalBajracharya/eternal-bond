import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Eye, Clock, Heart } from "lucide-react";
import {
  PremiumActionDialog,
  type PremiumActionKind,
} from "@/components/premium/PremiumActionDialog";

const ACTIONS: {
  kind: PremiumActionKind;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { kind: "priority-interest", label: "Send Priority Interest", hint: "Stand out in their daily set", Icon: Crown },
  { kind: "reveal-likes", label: "See Who Liked You", hint: "Reveal quiet admirers", Icon: Eye },
  { kind: "extend-chat", label: "Extend Chat", hint: "Give a connection more time", Icon: Clock },
  { kind: "extra-likes", label: "More Introductions Today", hint: "3 extra curated matches", Icon: Heart },
];

export default function Premium() {
  const [active, setActive] = useState<PremiumActionKind | null>(null);

  return (
    <div className="min-h-screen bg-gradient-blush">
      <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/today"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-[Fraunces] text-2xl text-foreground">Thoughtful upgrades</h1>
          <p className="text-sm text-muted-foreground">Optional, never required.</p>
        </div>
        <Button asChild size="sm" className="rounded-full bg-gradient-sunset text-white hover:opacity-90">
          <Link to="/pricing">See plans</Link>
        </Button>
      </header>


      <main className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid gap-3 sm:grid-cols-2">
          {ACTIONS.map(({ kind, label, hint, Icon }) => (
            <button
              key={kind}
              onClick={() => setActive(kind)}
              className="group text-left rounded-2xl bg-card/80 backdrop-blur border border-border/60 p-5 hover:shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/15 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-[Fraunces] text-lg text-foreground">{label}</div>
              <div className="text-sm text-muted-foreground mt-1">{hint}</div>
            </button>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          We never lock conversations or hide people behind paywalls. Upgrades are small,
          optional touches — used only if and when they feel right to you.
        </p>
      </main>

      {active && (
        <PremiumActionDialog
          open={!!active}
          onOpenChange={(o) => !o && setActive(null)}
          kind={active}
        />
      )}
    </div>
  );
}
