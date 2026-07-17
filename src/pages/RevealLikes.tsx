import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, Lock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutDialog } from "@/components/premium/CheckoutDialog";
import { getSubscription, getUsage, setUsage } from "@/lib/premium-state";
import { fmt } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Admirer = {
  id: string;
  name: string;
  age: number;
  city: string;
  avatar: string;
};

const MOCK: Admirer[] = [
  { id: "1", name: "Ananya", age: 27, city: "Kathmandu", avatar: "https://i.pravatar.cc/300?img=47" },
  { id: "2", name: "Meera", age: 29, city: "Pokhara", avatar: "https://i.pravatar.cc/300?img=48" },
  { id: "3", name: "Sneha", age: 26, city: "Lalitpur", avatar: "https://i.pravatar.cc/300?img=49" },
  { id: "4", name: "Kritika", age: 28, city: "Bhaktapur", avatar: "https://i.pravatar.cc/300?img=45" },
  { id: "5", name: "Ritu", age: 30, city: "Chitwan", avatar: "https://i.pravatar.cc/300?img=44" },
  { id: "6", name: "Prabha", age: 27, city: "Biratnagar", avatar: "https://i.pravatar.cc/300?img=41" },
];

export default function RevealLikes() {
  const sub = getSubscription();
  const isPremium = sub.planId !== "free";
  const [revealed, setRevealed] = useState<Set<string>>(new Set(isPremium ? MOCK.map((m) => m.id) : []));
  const [pending, setPending] = useState<Admirer | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const doReveal = (a: Admirer) => {
    if (isPremium) {
      setRevealed((r) => new Set(r).add(a.id));
      return;
    }
    const usage = getUsage();
    if (usage.revealsUsedToday < usage.revealsLimitToday) {
      // free daily reveal
      setUsage({ revealsUsedToday: usage.revealsUsedToday + 1 });
      setRevealed((r) => new Set(r).add(a.id));
      toast.success(`Revealed ${a.name}`, { description: "You have used today's free reveal." });
      return;
    }
    setPending(a);
  };

  return (
    <div className="min-h-screen bg-gradient-blush">
      <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.22em] text-primary-deep">Admirers</div>
          <h1 className="font-[Fraunces] text-2xl text-foreground">People who liked you</h1>
        </div>
        {!isPremium && (
          <Button size="sm" className="rounded-full bg-gradient-sunset text-white hover:opacity-90" onClick={() => setSubscribeOpen(true)}>
            Unlock all
          </Button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-sm text-muted-foreground text-center max-w-lg mx-auto mb-8">
          {isPremium
            ? "Everyone who has quietly noticed your profile."
            : `${MOCK.length} people have liked your profile. Reveal them one at a time, or unlock all with Premium.`}
        </p>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {MOCK.map((a) => {
            const isRevealed = revealed.has(a.id);
            return (
              <button
                key={a.id}
                onClick={() => !isRevealed && doReveal(a)}
                className={cn(
                  "group relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/60 bg-card/80 backdrop-blur text-left transition-all",
                  !isRevealed && "hover:shadow-[var(--shadow-card)]",
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
                {!isRevealed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="h-11 w-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-wider">Tap to reveal</div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  {isRevealed ? (
                    <>
                      <div className="font-[Fraunces] text-lg leading-tight">{a.name}, {a.age}</div>
                      <div className="text-xs opacity-80">{a.city}</div>
                    </>
                  ) : (
                    <div className="text-xs opacity-80 flex items-center gap-1">
                      <Heart className="h-3 w-3 fill-white" /> Liked your profile
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!isPremium && (
          <div className="mt-12 rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-8 text-center max-w-xl mx-auto">
            <Eye className="h-6 w-6 text-primary-deep mx-auto mb-3" />
            <div className="font-[Fraunces] text-xl text-foreground">See everyone at once</div>
            <p className="text-sm text-muted-foreground mt-2">
              Premium reveals every admirer, past and future — without spending per person.
            </p>
            <Button asChild className="mt-5 rounded-full bg-gradient-sunset text-white hover:opacity-90">
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
          onSuccess={() => setRevealed((r) => new Set(r).add(pending.id))}
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
          onSuccess={() => {
            import("@/lib/premium-state").then(({ activatePlan }) => activatePlan("premium_monthly"));
            setRevealed(new Set(MOCK.map((m) => m.id)));
          }}
        />
      )}
    </div>
  );
}
