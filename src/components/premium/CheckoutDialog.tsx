import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fmt } from "@/lib/pricing";
import { useAuth } from "@/hooks/use-auth";
import { createCheckoutSession } from "@/api/monetization";

type Stage = "review" | "processing" | "failed";

interface Props {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  price: number;
  cadence?: string;
  appliesWhen: string;
  receiptLabel: string;
}

export function CheckoutDialog({
  productId,
  open,
  onOpenChange,
  title,
  description,
  price,
  cadence,
  appliesWhen,
}: Props) {
  const [stage, setStage] = React.useState<Stage>("review");
  const { session } = useAuth();

  React.useEffect(() => {
    if (open) setStage("review");
  }, [open]);

  const mapProductId = (id: string): string => {
    switch (id) {
      case "reveal-like": return "reveal_like";
      case "priority-interest": return "priority_interest";
      case "extend-chat": return "extend_chat";
      case "extra-likes": return "extra_like";
      case "undo-skip": return "undo_skip";
      case "profile-boost": return "profile_boost";
      default: return id;
    }
  };

  const startCheckout = async () => {
    if (!session?.access_token) {
      toast.error("Please sign in to make a purchase");
      return;
    }

    setStage("processing");
    try {
      const checkout = await createCheckoutSession(session.access_token, {
        productId: mapProductId(productId),
      });
      window.location.assign(checkout.checkoutUrl);
    } catch (err: any) {
      console.error("Unable to create checkout session:", err);
      toast.error(err.message || "Unable to start secure checkout. Please try again.");
      setStage("failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => stage !== "processing" && onOpenChange(nextOpen)}>
      <DialogContent className={cn("max-w-md border-0 p-0 overflow-hidden rounded-[1.5rem] bg-gradient-blush shadow-[var(--shadow-card)]")}>
        <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full opacity-60 blur-3xl bg-primary/30" />
        <div className="relative px-7 pt-8 pb-7 min-h-[340px] flex flex-col">
          {stage === "review" && (
            <>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <DialogTitle className="font-[Fraunces] text-[1.5rem] leading-tight text-foreground">{title}</DialogTitle>
              {description && <DialogDescription className="mt-2 text-[0.95rem] text-muted-foreground">{description}</DialogDescription>}
              <div className="mt-6 rounded-2xl bg-card/70 backdrop-blur border border-border/60 p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-[0.75rem] uppercase tracking-[0.14em] text-muted-foreground">Total</div>
                  <div className="font-[Fraunces] text-2xl text-foreground">
                    {fmt(price)}
                    {cadence && <span className="text-sm text-muted-foreground ml-1.5">/ {cadence}</span>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{appliesWhen}</div>
              </div>
              <div className="mt-auto pt-6 flex flex-col gap-2">
                <Button size="lg" className="w-full rounded-full bg-gradient-sunset text-white hover:opacity-90" onClick={startCheckout} disabled={!session?.access_token}>
                  Continue to secure checkout
                </Button>
                <button onClick={() => onOpenChange(false)} className="w-full text-center text-[0.85rem] text-muted-foreground hover:text-foreground py-2">
                  Cancel
                </button>
              </div>
            </>
          )}

          {stage === "processing" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="font-[Fraunces] text-xl text-foreground mt-5">Opening secure checkout</div>
              <div className="text-sm text-muted-foreground mt-2 max-w-xs">Please hold on while we connect you with our payment partner.</div>
            </div>
          )}

          {stage === "failed" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive"><X className="h-8 w-8" strokeWidth={3} /></div>
              <div className="font-[Fraunces] text-2xl text-foreground mt-5">Checkout couldn't start</div>
              <div className="text-sm text-muted-foreground mt-2 max-w-xs">No charge was made. Please check your connection and try again.</div>
              <div className="mt-6 flex flex-col gap-2 w-full">
                <Button className="rounded-full bg-gradient-sunset text-white hover:opacity-90" onClick={startCheckout}>Try again</Button>
                <button onClick={() => onOpenChange(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
