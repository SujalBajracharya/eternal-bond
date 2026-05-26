import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { addPurchase } from "@/lib/purchase-history";
import { t, formatTimestamp } from "@/lib/i18n-receipts";

export type PremiumActionKind =
  | "priority-interest"
  | "reveal-likes"
  | "extend-chat"
  | "extra-likes";

type Preset = {
  title: string;
  tagline: string;
  benefits: string[];
  ctaLabel: string;
  price: string;
  note: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string; // hsl token
  receiptLabel: string; // short name for receipt
  appliesWhen: string; // when it takes effect
};

const PRESETS: Record<PremiumActionKind, Preset> = {
  "priority-interest": {
    title: "Send a Priority Interest",
    tagline: "Move to the top of their Today's matches — gently.",
    benefits: [
      "Appears first in their daily set",
      "Marked with a soft Priority badge",
      "3× more likely to get a thoughtful reply",
    ],
    ctaLabel: "Send Priority Interest",
    price: "1 credit · ₹149",
    note: "One-time. No auto-renewal. They will never know it was paid.",
    Icon: Sparkles,
    accent: "var(--primary)",
    receiptLabel: "Priority Interest sent",
    appliesWhen: "Applies to their next daily set (within ~24h).",
  },
  "reveal-likes": {
    title: "See Who's Interested in You",
    tagline: "View the people who already noticed your profile.",
    benefits: [
      "Reveal up to 12 quiet admirers",
      "Sorted by compatibility, not recency",
      "Their identity stays private to others",
    ],
    ctaLabel: "Reveal My Admirers",
    price: "₹299 / month",
    note: "Cancel anytime in Settings.",
    Icon: Sparkles,
    accent: "var(--plum)",
    receiptLabel: "Admirers unlocked",
    appliesWhen: "Available now in your Likes tab. Renews monthly.",
  },
  "extend-chat": {
    title: "Extend This Conversation",
    tagline: "Give this connection more time to grow.",
    benefits: [
      "Adds 7 more days to the chat window",
      "Messages and shared photos stay safe",
      "Either of you can extend",
    ],
    ctaLabel: "Extend by 7 days",
    price: "₹99",
    note: "One-time, just for this conversation.",
    Icon: Sparkles,
    accent: "var(--accent)",
    receiptLabel: "Chat extended by 7 days",
    appliesWhen: "New expiry applied immediately to this conversation.",
  },
  "extra-likes": {
    title: "A Few More Introductions Today",
    tagline: "Receive 3 additional curated matches, hand-picked.",
    benefits: [
      "3 extra profiles, same compatibility care",
      "Delivered within an hour",
      "Doesn't change tomorrow's set",
    ],
    ctaLabel: "Add 3 Introductions",
    price: "₹199",
    note: "Used today only. No subscription.",
    Icon: Sparkles,
    accent: "var(--primary-glow)",
    receiptLabel: "3 introductions added",
    appliesWhen: "Arriving in Today within the next hour.",
  },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: PremiumActionKind;
  onConfirm?: () => void;
}

export function PremiumActionDialog({ open, onOpenChange, kind, onConfirm }: Props) {
  const p = PRESETS[kind];
  const Icon = p.Icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-md border-0 p-0 overflow-hidden rounded-[1.5rem]",
          "bg-gradient-blush shadow-[var(--shadow-card)]",
          "animate-scale-in",
        )}
      >
        {/* Soft halo */}
        <div
          className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full opacity-60 blur-3xl"
          style={{ background: `hsl(${p.accent} / 0.35)` }}
        />

        <div className="relative px-7 pt-8 pb-7">
          {/* Icon mark */}
          <div
            className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: `hsl(${p.accent} / 0.15)`,
              color: `hsl(${p.accent})`,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>

          <DialogTitle className="font-[Fraunces] text-[1.6rem] leading-tight text-foreground">
            {p.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-[0.95rem] text-muted-foreground">
            {p.tagline}
          </DialogDescription>

          {/* Benefits */}
          <ul className="mt-6 space-y-3">
            {p.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[0.92rem] text-foreground/85">
                <span
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: `hsl(${p.accent} / 0.15)`, color: `hsl(${p.accent})` }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* Price strip */}
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-card/70 backdrop-blur px-4 py-3 border border-border/60">
            <div>
              <div className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                Today
              </div>
              <div className="font-[Fraunces] text-lg text-foreground">{p.price}</div>
            </div>
            <div className="text-right text-[0.7rem] text-muted-foreground max-w-[55%] leading-relaxed">
              {p.note}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full rounded-full text-[0.95rem] font-medium shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.01]"
              style={{
                background: `linear-gradient(120deg, hsl(${p.accent}), hsl(${p.accent} / 0.85))`,
                color: "white",
              }}
              onClick={() => {
                onConfirm?.();
                onOpenChange(false);
                const record = addPurchase({
                  kind,
                  label: p.receiptLabel,
                  appliesWhen: p.appliesWhen,
                  price: p.price,
                });
                toast.success(p.receiptLabel, {
                  description: t.receiptSavedDescription(
                    p.appliesWhen,
                    p.price,
                    formatTimestamp(record.timestamp),
                  ),
                  duration: 6000,
                  action: {
                    label: t.viewReceipt,
                    onClick: () => {
                      window.location.assign("/receipts");
                    },
                  },
                });
              }}
            >
              {p.ctaLabel}
            </Button>
            <button
              onClick={() => onOpenChange(false)}
              className="w-full text-center text-[0.85rem] text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
