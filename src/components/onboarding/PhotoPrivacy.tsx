import { Eye, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type Visibility = "visible" | "blurred";

interface Props {
  photos: string[];
  visibility: Record<string, Visibility>;
  onChange: (next: Record<string, Visibility>) => void;
}

export const getVisibility = (
  url: string,
  index: number,
  map: Record<string, Visibility>,
): Visibility => {
  if (map[url]) return map[url];
  // Default: first two visible, rest blurred
  return index < 2 ? "visible" : "blurred";
};

const PhotoPrivacy = ({ photos, visibility, onChange }: Props) => {
  if (photos.length === 0) return null;

  const visibleCount = photos.filter(
    (p, i) => getVisibility(p, i, visibility) === "visible",
  ).length;

  const MIN_VISIBLE = Math.min(2, photos.length);

  const setOne = (url: string, v: Visibility) => {
    // Enforce minimum visible photos
    if (v === "blurred" && visibleCount <= MIN_VISIBLE) return;
    onChange({ ...visibility, [url]: v });
  };

  return (
    <div className="space-y-5">
      {/* Trust note */}
      <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-4">
        <div className="grid place-items-center w-9 h-9 rounded-full bg-background shadow-soft shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          At least {MIN_VISIBLE} photos must stay visible so others can recognize you.
          The rest can be softly blurred until you both connect — change anytime.
        </div>
      </div>

      {/* Per-photo controls */}
      <div className="space-y-3">
        {photos.map((url, i) => {
          const v = getVisibility(url, i, visibility);
          return (
            <div
              key={url}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-3 transition-all duration-300 hover:border-primary/40"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-secondary/40">
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-500",
                    v === "blurred" && "blur-md scale-110",
                  )}
                />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-background/85 text-[9px] font-semibold tracking-wide">
                    MAIN
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Photo {i + 1}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {v === "visible"
                    ? "Anyone viewing your profile can see this photo."
                    : "Softly blurred — revealed only when you both connect."}
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-full bg-secondary/60 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setOne(url, "visible")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                    v === "visible"
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={v === "visible"}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Visible to others</span>
                  <span className="sm:hidden">Visible</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOne(url, "blurred")}
                  disabled={v === "visible" && visibleCount <= MIN_VISIBLE}
                  title={v === "visible" && visibleCount <= MIN_VISIBLE ? `Keep at least ${MIN_VISIBLE} photos visible` : undefined}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                    v === "blurred"
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                  )}
                  aria-pressed={v === "blurred"}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Blurred until match</span>
                  <span className="sm:hidden">Blurred</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-secondary/30 to-background p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="font-serif text-base">How others see your profile</h4>
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Live preview
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {photos.map((url, i) => {
            const v = getVisibility(url, i, visibility);
            return (
              <div
                key={`prev-${url}`}
                className="relative aspect-square rounded-xl overflow-hidden bg-secondary/40 group"
              >
                <img
                  src={url}
                  alt=""
                  className={cn(
                    "w-full h-full object-cover transition-all duration-700",
                    v === "blurred" && "blur-xl scale-125",
                  )}
                />
                {v === "blurred" && (
                  <div className="absolute inset-0 grid place-items-center bg-background/10">
                    <div className="flex flex-col items-center gap-1 text-foreground/80">
                      <Lock className="w-4 h-4" />
                      <span className="text-[9px] font-medium tracking-wide">
                        Private
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {visibleCount} of {photos.length} visible · {photos.length - visibleCount} kept private until a mutual match.
        </p>
      </div>
    </div>
  );
};

export default PhotoPrivacy;
