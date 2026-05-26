import { useEffect } from "react";
import { Heart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  name: string;
  photo: string;
  onClose: () => void;
}

const MatchCelebration = ({ name, photo, onClose }: Props) => {
  useEffect(() => {
    const t = setTimeout(onClose, 6500);
    return () => clearTimeout(t);
  }, [onClose]);

  // Generate floating hearts + confetti
  const hearts = Array.from({ length: 14 });
  const confetti = Array.from({ length: 24 });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/85 to-accent/30 backdrop-blur-md" />

      {/* Confetti */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 1.2;
          const colors = ["bg-primary", "bg-accent", "bg-plum", "bg-primary-glow"];
          const c = colors[i % colors.length];
          return (
            <span
              key={`c-${i}`}
              className={`absolute top-0 w-2 h-3 ${c} rounded-sm animate-confetti-fall`}
              style={{ left: `${left}%`, animationDelay: `${delay}s` }}
            />
          );
        })}
        {hearts.map((_, i) => {
          const left = 10 + Math.random() * 80;
          const delay = Math.random() * 1.5;
          const size = 14 + Math.random() * 22;
          return (
            <Heart
              key={`h-${i}`}
              className="absolute bottom-0 text-primary fill-primary animate-rise-fade"
              style={{ left: `${left}%`, width: size, height: size, animationDelay: `${delay}s` }}
            />
          );
        })}
      </div>

      {/* Card */}
      <div className="relative z-10 max-w-md w-full rounded-[2rem] bg-card border border-border/60 shadow-glow p-8 text-center animate-match-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-full hover:bg-secondary transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Heart with avatar */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ring-ping" />
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-ring-ping" style={{ animationDelay: "0.5s" }} />
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-card shadow-glow">
            <img src={photo} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-gradient-sunset grid place-items-center shadow-soft animate-heart-beat">
            <Heart className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary-deep mb-2">
          <Sparkles className="h-3.5 w-3.5" /> Mutual interest
        </div>
        <h2 className="font-serif text-4xl">It's a match!</h2>
        <p className="mt-3 text-muted-foreground">
          You and <span className="font-medium text-foreground">{name}</span> both said yes.
          Begin a thoughtful conversation when you're ready.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" className="h-12 rounded-full bg-gradient-sunset border-0 text-primary-foreground shadow-soft hover:shadow-glow">
            Send a message
          </Button>
          <Button variant="ghost" onClick={onClose} className="rounded-full">
            Continue browsing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchCelebration;
