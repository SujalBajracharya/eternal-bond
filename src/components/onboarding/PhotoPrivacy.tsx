import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  photos: string[];
  value: Record<string, "visible" | "blurred">;
  onChange: (v: Record<string, "visible" | "blurred">) => void;
}

const PhotoPrivacy = ({ photos, value, onChange }: Props) => {
  const toggleVisibility = (url: string, visibility: "visible" | "blurred") => {
    onChange({
      ...value,
      [url]: visibility,
    });
  };

  return (
    <div className="space-y-4">
      {/* Info box */}
      <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-4">
        <ShieldCheck className="w-4 h-4 text-primary mt-1" />
        <div className="text-sm text-muted-foreground leading-relaxed">
          Control who can see your photos. Blurred photos are only revealed to your accepted connections.
        </div>
      </div>

      {/* Grid of photos for per-photo privacy management */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((url, i) => {
          const vis = value[url] ?? "visible";
          const isBlurred = vis === "blurred";

          return (
            <div
              key={url}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/60 bg-secondary/40 group flex flex-col justify-end"
            >
              {/* Image with blur transition */}
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                  isBlurred && "blur-[8px] scale-105"
                )}
              />

              {/* Blurred indicator overlay */}
              {isBlurred && (
                <div className="absolute inset-0 bg-background/25 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-background/90 text-foreground text-[10px] font-semibold tracking-wider uppercase shadow-soft flex items-center gap-1">
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                    Blurred
                  </span>
                </div>
              )}

              {/* Main photo indicator */}
              {i === 0 && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-sunset text-primary-foreground text-[9px] font-semibold tracking-wide shadow-soft z-10">
                  MAIN
                </span>
              )}

              {/* Privacy controls overlay */}
              <div className="relative z-10 w-full p-2 bg-gradient-to-t from-black/80 via-black/45 to-transparent flex gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => toggleVisibility(url, "visible")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all duration-300",
                    !isBlurred
                      ? "bg-white text-black border-white shadow-soft"
                      : "bg-black/60 text-white/80 border-white/10 hover:text-white hover:bg-black/80"
                  )}
                >
                  <Eye className="w-3 h-3" />
                  Visible
                </button>
                <button
                  type="button"
                  onClick={() => toggleVisibility(url, "blurred")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all duration-300",
                    isBlurred
                      ? "bg-white text-black border-white shadow-soft"
                      : "bg-black/60 text-white/80 border-white/10 hover:text-white hover:bg-black/80"
                  )}
                >
                  <EyeOff className="w-3 h-3" />
                  Blurred
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoPrivacy;