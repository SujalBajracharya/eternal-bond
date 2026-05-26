import { cn } from "@/lib/utils";

/**
 * A little heart character with eyes that winks on hover and beats on click.
 * `state`: idle | winking (hover) | beating (clicked)
 */
const HeartMascot = ({ state = "idle", className }: { state?: "idle" | "wink" | "beat"; className?: string }) => {
  const beat = state === "beat";
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center",
        beat && "animate-heart-beat",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6 drop-shadow-[0_2px_6px_hsl(var(--primary)/0.55)]">
        <defs>
          <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary-glow))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <path
          d="M16 28s-11-7.2-11-15a6 6 0 0 1 11-3.3A6 6 0 0 1 27 13c0 7.8-11 15-11 15z"
          fill="url(#heartGrad)"
          stroke="hsl(var(--primary-deep))"
          strokeWidth="0.6"
        />
        {/* Cheeks */}
        <circle cx="11" cy="17.5" r="1.1" fill="hsl(var(--primary-deep) / 0.35)" />
        <circle cx="21" cy="17.5" r="1.1" fill="hsl(var(--primary-deep) / 0.35)" />
        {/* Eyes — left winks via animate-wink, right always open */}
        <g className={state === "wink" ? "origin-center" : ""}>
          <ellipse
            cx="12.5"
            cy="14.2"
            rx="1.1"
            ry="1.4"
            fill="white"
            style={{ transformOrigin: "12.5px 14.2px" }}
            className={state === "wink" ? "animate-wink" : ""}
          />
          <ellipse cx="19.5" cy="14.2" rx="1.1" ry="1.4" fill="white" />
          <circle cx="12.5" cy="14.4" r="0.45" fill="hsl(var(--foreground))" className={state === "wink" ? "animate-wink" : ""} style={{ transformOrigin: "12.5px 14.4px" }} />
          <circle cx="19.5" cy="14.4" r="0.45" fill="hsl(var(--foreground))" />
        </g>
        {/* Smile */}
        <path d="M13.5 17.8 Q16 19.6 18.5 17.8" stroke="hsl(var(--foreground))" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
};

export default HeartMascot;
