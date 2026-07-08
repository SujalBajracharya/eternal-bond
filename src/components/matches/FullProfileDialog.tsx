import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock, MapPin, ShieldCheck, X, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import ReportPhotoDialog from "@/components/ReportPhotoDialog";

export interface FullProfileData {
  id: string;
  name: string;
  age: number;
  mood: string;
  about: string;
  family: string;
  values: string[];
  location: string;
  verified: boolean;
  highlights: { icon: any; label: string }[];
  // Gallery: first photo is the hero. Each photo has its own visibility.
  gallery: { url: string; blurred?: boolean }[];
}

const FullProfileDialog = ({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: FullProfileData | null;
}) => {
  const [active, setActive] = useState(0);
  const [reportPhotoUrl, setReportPhotoUrl] = useState<string | null>(null);
  const { user } = useAuth();

  if (!profile) return null;
  const photos = profile.gallery;
  const safeActive = Math.min(active, photos.length - 1);
  const current = photos[safeActive];

  return (
    <Dialog open={open} onOpenChange={(v) => { setActive(0); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border/60">
        <DialogHeader className="sr-only">
          <DialogTitle>{profile.name}'s full profile</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 max-h-[88vh] overflow-y-auto">
          {/* Gallery */}
          <div className="relative bg-muted">
            <div className="relative aspect-[4/5] md:aspect-auto md:h-full overflow-hidden">
              <img
                src={current.url}
                alt={`${profile.name} photo ${safeActive + 1}`}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  current.blurred && "blur-2xl scale-110",
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />

              {user?.id !== profile.id && (
                <button
                  onClick={() => setReportPhotoUrl(current.url)}
                  className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-background/85 hover:bg-background backdrop-blur transition-all z-10 text-rose-500 hover:text-rose-600 shadow-sm"
                  title="Report Photo"
                >
                  <Flag className="h-4 w-4 fill-rose-500" />
                </button>
              )}

              {current.blurred && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-2xl bg-background/85 backdrop-blur px-4 py-3 text-xs flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary-deep" />
                    Private — revealed when you both connect
                  </div>
                </div>
              )}

              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActive((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-background/85 hover:bg-background backdrop-blur transition-colors"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActive((i) => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-background/85 hover:bg-background backdrop-blur transition-colors"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === safeActive ? "w-8 bg-background" : "w-1.5 bg-background/60",
                        )}
                        aria-label={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="hidden md:flex gap-2 p-3 bg-card/50 backdrop-blur">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative h-14 w-14 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                      i === safeActive ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={p.url} alt="" className={cn("w-full h-full object-cover", p.blurred && "blur-md scale-110")} />
                    {p.blurred && (
                      <span className="absolute inset-0 grid place-items-center bg-background/20">
                        <Lock className="h-3 w-3 text-foreground" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:p-8">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-full hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-baseline gap-3">
              <h2 className="font-serif text-3xl">{profile.name}</h2>
              <span className="text-muted-foreground">· {profile.age}</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
              {profile.verified && (
                <span className="inline-flex items-center gap-1 text-sage"><ShieldCheck className="h-3.5 w-3.5" />Verified</span>
              )}
            </div>
            <p className="mt-4 italic text-foreground/80">"{profile.mood}"</p>

            <div className="mt-6 space-y-5">
              <ul className="space-y-3">
                {profile.highlights.map((h, i) => {
                  const Icon = h.icon;
                  return (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary-deep" />
                      </span>
                      <span className="text-foreground/85 leading-relaxed">{h.label}</span>
                    </li>
                  );
                })}
              </ul>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">In their words</div>
                <p className="text-sm text-foreground/85 leading-relaxed">{profile.about}</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Family</div>
                <p className="text-sm text-foreground/85 leading-relaxed">{profile.family}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.values.map((v) => (
                  <Badge key={v} variant="secondary" className="rounded-full font-normal">{v}</Badge>
                ))}
              </div>
            </div>

            <Button onClick={() => onOpenChange(false)} variant="outline" className="mt-8 rounded-full w-full">
              Close profile
            </Button>
          </div>
        </div>
      </DialogContent>
      {profile && (
        <ReportPhotoDialog
          open={!!reportPhotoUrl}
          onOpenChange={(open) => !open && setReportPhotoUrl(null)}
          photoUrl={reportPhotoUrl || ""}
          reportedUserId={profile.id}
        />
      )}
    </Dialog>
  );
};

export default FullProfileDialog;
