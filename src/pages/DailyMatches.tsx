import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ChevronRight, X, ChevronDown, ChevronUp, ShieldCheck, Sparkles, Sunrise, MapPin, Briefcase, GraduationCap, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import HeartMascot from "@/components/matches/HeartMascot";
import MatchCelebration from "@/components/matches/MatchCelebration";
import FullProfileDialog, { type FullProfileData } from "@/components/matches/FullProfileDialog";
import match1 from "@/assets/match-1.jpg";
import match2 from "@/assets/match-2.jpg";
import match3 from "@/assets/match-3.jpg";
import match4 from "@/assets/match-4.jpg";
import match5 from "@/assets/match-5.jpg";

type GalleryItem = { url: string; blurred?: boolean };

type Match = {
  id: string;
  name: string;
  age: number;
  mood: string;
  photo: string;
  blurred?: boolean;
  gallery: GalleryItem[];
  highlights: { icon: any; label: string }[];
  about: string;
  family: string;
  values: string[];
  location: string;
  verified: boolean;
  // simulate mutual interest probability
  mutual?: boolean;
};

const MATCHES: Match[] = [
  {
    id: "1",
    name: "Ananya",
    age: 27,
    mood: "Reading Rumi, learning pottery on Sundays.",
    photo: match1,
    gallery: [
      { url: match1 },
      { url: match3 },
      { url: match5, blurred: true },
      { url: match2, blurred: true },
    ],
    highlights: [
      { icon: Briefcase, label: "Architect at Studio Lotus" },
      { icon: MapPin, label: "Bengaluru · Originally from Pune" },
      { icon: Users, label: "Nuclear family, one younger sister" },
    ],
    about:
      "Quietly curious. I design spaces that breathe and believe a home is built from small rituals — chai at sunrise, books on the floor, music after dinner.",
    family: "Father is a retired professor; mother runs a small bakery. Close-knit, gently traditional, deeply supportive of individual paths.",
    values: ["Family-first", "Spiritual but not rigid", "Loves slow travel"],
    location: "Bengaluru, IN",
    verified: true,
    mutual: true,
  },
  {
    id: "2",
    name: "Aarav",
    age: 30,
    mood: "Engineer by day, amateur sitar player by night.",
    photo: match2,
    blurred: true,
    gallery: [
      { url: match2, blurred: true },
      { url: match4, blurred: true },
      { url: match1 },
    ],
    highlights: [
      { icon: Briefcase, label: "Senior Engineer · Fintech" },
      { icon: GraduationCap, label: "Masters, IIT Bombay" },
      { icon: MapPin, label: "Mumbai · Open to relocate" },
    ],
    about:
      "I find calm in classical music and clarity in long walks. Looking for a partner who values quiet evenings as much as ambitious mornings.",
    family: "Joint family in Mumbai. Parents, grandmother, and an elder brother who lives close by.",
    values: ["Vegetarian", "Practicing Hindu", "Family-oriented"],
    location: "Mumbai, IN",
    verified: true,
  },
  {
    id: "3",
    name: "Meher",
    age: 28,
    mood: "Doctor, baker on weekends, dog mom always.",
    photo: match3,
    gallery: [
      { url: match3 },
      { url: match5 },
      { url: match1, blurred: true },
    ],
    highlights: [
      { icon: Briefcase, label: "Pediatrician" },
      { icon: MapPin, label: "Delhi NCR" },
      { icon: Users, label: "Nuclear family" },
    ],
    about:
      "Warm, a little stubborn, and endlessly curious about people. I want a partnership of equals — gentle, honest, and a little adventurous.",
    family: "Parents are both retired doctors. One older brother, married, lives in Toronto.",
    values: ["Career-driven", "Loves animals", "Open-minded"],
    location: "New Delhi, IN",
    verified: true,
    mutual: true,
  },
  {
    id: "4",
    name: "Rohan",
    age: 31,
    mood: "Building a quiet life around books and family.",
    photo: match4,
    blurred: true,
    gallery: [
      { url: match4, blurred: true },
      { url: match2 },
      { url: match1, blurred: true },
    ],
    highlights: [
      { icon: Briefcase, label: "Product Designer" },
      { icon: GraduationCap, label: "NID, Ahmedabad" },
      { icon: MapPin, label: "Hyderabad" },
    ],
    about:
      "I write more than I speak. I believe in deep conversations, quiet weekends, and showing up for the people who matter.",
    family: "Joint family. Parents, an elder sister and her husband, and a niece I adore.",
    values: ["Introverted", "Spiritual", "Loves cooking"],
    location: "Hyderabad, IN",
    verified: false,
  },
  {
    id: "5",
    name: "Ishita",
    age: 26,
    mood: "Lawyer with a soft spot for old films.",
    photo: match5,
    gallery: [
      { url: match5 },
      { url: match3 },
      { url: match1, blurred: true },
      { url: match2, blurred: true },
    ],
    highlights: [
      { icon: Briefcase, label: "Corporate Lawyer" },
      { icon: GraduationCap, label: "NLSIU Bangalore" },
      { icon: MapPin, label: "Bengaluru" },
    ],
    about:
      "Ambitious but never in a rush. I love handwritten letters, slow Sundays, and someone who can make me laugh through a hard week.",
    family: "Nuclear family. One younger brother in college. Liberal, warm, and very close.",
    values: ["Independent", "Family-first", "Loves cinema"],
    location: "Bengaluru, IN",
    verified: true,
    mutual: true,
  },
];

type Decision = "interested" | "skipped";

const DailyMatches = () => {
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<Decision | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [mascotState, setMascotState] = useState<"idle" | "wink" | "beat">("idle");
  const [burst, setBurst] = useState(false);
  const [celebrate, setCelebrate] = useState<Match | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  // Per-card gallery active index for inline preview
  const [galleryIdx, setGalleryIdx] = useState(0);

  useEffect(() => {
    document.title = "Today's Matches — EternalBond";
    const desc = "Five thoughtfully chosen introductions, reviewed one at a time. A calm, intentional way to find a partner.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", desc);
  }, []);

  const total = MATCHES.length;
  const current = MATCHES[index];
  const done = index >= total;
  const interestedCount = useMemo(() => Object.values(decisions).filter(d => d === "interested").length, [decisions]);

  const advance = () => {
    setFeedback(null);
    setExpanded(false);
    setBurst(false);
    setMascotState("idle");
    setGalleryIdx(0);
    setIndex(i => i + 1);
    setAnimKey(k => k + 1);
  };

  const decide = (d: Decision) => {
    setDecisions(prev => ({ ...prev, [current.id]: d }));
    setFeedback(d);

    if (d === "interested") {
      setBurst(true);
      setMascotState("beat");
      // Match celebration if mutual
      if (current.mutual) {
        setTimeout(() => {
          setCelebrate(current);
          setFeedback(null);
        }, 900);
        setTimeout(() => {
          // advance after celebration closes — actually advance happens on close handler
        }, 950);
        return;
      }
    }

    setTimeout(advance, 700);
  };

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const heroPhoto = current ? current.gallery[Math.min(galleryIdx, current.gallery.length - 1)] : null;

  const fullProfile: FullProfileData | null = current
    ? {
        id: current.id,
        name: current.name,
        age: current.age,
        mood: current.mood,
        about: current.about,
        family: current.family,
        values: current.values,
        location: current.location,
        verified: current.verified,
        highlights: current.highlights,
        gallery: current.gallery,
      }
    : null;

  return (
    <main className="min-h-screen bg-background relative overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-radial-glow opacity-70" />
        <div className="absolute top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-radial-glow opacity-50" />
      </div>

      <header className="border-b border-border/60 backdrop-blur-sm bg-background/70 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl tracking-tight">EternalBond</Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-sage" />
            Privacy-first matchmaking
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-24">
        <div className="grid md:grid-cols-12 gap-6 mb-10">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Sunrise className="h-4 w-4 text-accent" />
              {greet()}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">
              Your matches <span className="text-gradient-sunset">for today</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-md">
              Five introductions, hand-picked. Take a moment to review thoughtfully — there is no rush, and no endless feed.
            </p>
          </div>
          <div className="md:col-span-5 flex md:justify-end items-end">
            <div className="w-full md:w-72 rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-5 shadow-soft">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Today's progress</span>
                <span className="tabular-nums">{Math.min(index, total)} of {total}</span>
              </div>
              <div className="mt-3 flex gap-1.5">
                {MATCHES.map((m, i) => {
                  const state = decisions[m.id];
                  const active = i === index;
                  return (
                    <div key={m.id} className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          state === "interested" && "bg-primary",
                          state === "skipped" && "bg-muted-foreground/40",
                          !state && active && "bg-accent w-1/3",
                          !state && !active && "w-0",
                          state && "w-full"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Heart className="h-3.5 w-3.5 text-primary" />
                {interestedCount} marked interested
              </div>
            </div>
          </div>
        </div>

        {!done && current && heroPhoto ? (
          <div key={animKey} className="grid md:grid-cols-12 gap-8 animate-fade-in">
            {/* Photo column with inline gallery */}
            <div className="md:col-span-7 relative">
              <div className="relative rounded-[2rem] overflow-hidden shadow-card bg-muted aspect-[4/5]">
                <img
                  src={heroPhoto.url}
                  alt={`Portrait of ${current.name}`}
                  width={768}
                  height={960}
                  loading="lazy"
                  className={cn(
                    "h-full w-full object-cover transition-all duration-700",
                    heroPhoto.blurred && "blur-2xl scale-110"
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />

                <div className="absolute top-5 left-5 flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur text-xs font-medium">
                    {index + 1} of {total}
                  </span>
                  {current.verified && (
                    <span className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur text-xs font-medium inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-sage" /> Verified
                    </span>
                  )}
                </div>

                {heroPhoto.blurred && (
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <div className="rounded-2xl bg-background/85 backdrop-blur px-4 py-2.5 text-xs flex items-center gap-2 shadow-soft">
                      <Lock className="h-3.5 w-3.5 text-primary-deep" />
                      Private — revealed when mutual
                    </div>
                  </div>
                )}

                {/* Gallery dots */}
                {current.gallery.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {current.gallery.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setGalleryIdx(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === galleryIdx ? "w-8 bg-background" : "w-1.5 bg-background/60 hover:bg-background/80",
                        )}
                        aria-label={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {current.gallery.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {current.gallery.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIdx(i)}
                      className={cn(
                        "relative h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                        i === galleryIdx ? "border-primary shadow-soft" : "border-transparent opacity-70 hover:opacity-100",
                      )}
                      aria-label={`View photo ${i + 1}`}
                    >
                      <img src={p.url} alt="" className={cn("w-full h-full object-cover", p.blurred && "blur-md scale-110")} />
                      {p.blurred && (
                        <span className="absolute inset-0 grid place-items-center bg-background/20">
                          <Lock className="h-3.5 w-3.5 text-foreground" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div aria-hidden className="hidden md:block absolute -bottom-6 -right-6 h-32 w-32 rounded-3xl bg-gradient-blush border border-border/60 -z-0" />
            </div>

            {/* Details column */}
            <div className="md:col-span-5 flex flex-col">
              <div className="flex items-baseline gap-3">
                <h2 className="font-serif text-3xl">{current.name}</h2>
                <span className="text-muted-foreground">· {current.age}</span>
              </div>
              <p className="mt-2 text-foreground/80 italic">"{current.mood}"</p>

              <ul className="mt-6 space-y-3">
                {current.highlights.map((h, i) => {
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

              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-deep hover:gap-2 transition-all w-fit"
              >
                {expanded ? "Show less" : "A little more about them"}
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {expanded && (
                <div className="mt-4 space-y-4 animate-fade-in">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">In their words</div>
                    <p className="text-sm text-foreground/85 leading-relaxed">{current.about}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Family</div>
                    <p className="text-sm text-foreground/85 leading-relaxed">{current.family}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {current.values.map(v => (
                      <Badge key={v} variant="secondary" className="rounded-full font-normal">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto pt-8">
                <div className="flex flex-col gap-3">
                  {/* Interested — with mascot, hover wink, click burst */}
                  <button
                    onClick={() => decide("interested")}
                    onMouseEnter={() => mascotState !== "beat" && setMascotState("wink")}
                    onMouseLeave={() => mascotState !== "beat" && setMascotState("idle")}
                    className={cn(
                      "group relative overflow-hidden h-14 rounded-full px-6 font-medium text-primary-foreground",
                      "bg-gradient-sunset shadow-soft hover:shadow-glow",
                      "transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0",
                      "ring-2 ring-transparent hover:ring-primary/30",
                    )}
                  >
                    {/* Shimmer */}
                    <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent,hsl(0_0%_100%/0.35),transparent)] bg-[length:200%_100%] animate-shimmer opacity-60" />

                    <span className="relative flex items-center justify-center gap-3 text-base">
                      <HeartMascot state={mascotState} className="transition-transform group-hover:rotate-[-6deg]" />
                      <span>I'm interested</span>
                      <HeartMascot state={mascotState === "beat" ? "beat" : "idle"} />
                    </span>

                    {/* Burst hearts */}
                    {burst && (
                      <span aria-hidden className="absolute inset-0 pointer-events-none">
                        {Array.from({ length: 8 }).map((_, i) => {
                          const angle = (i / 8) * Math.PI * 2;
                          const x = Math.cos(angle) * 60;
                          const y = Math.sin(angle) * 30;
                          return (
                            <Heart
                              key={i}
                              className="absolute left-1/2 top-1/2 h-4 w-4 text-primary-foreground fill-primary-foreground animate-heart-burst"
                              style={{
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                animationDelay: `${i * 30}ms`,
                              }}
                            />
                          );
                        })}
                      </span>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => decide("skipped")}
                      className={cn(
                        "group h-12 rounded-full border border-border bg-card hover:bg-secondary/60",
                        "text-sm font-medium transition-all duration-300 hover:-translate-y-0.5",
                        "flex items-center justify-center gap-2",
                      )}
                    >
                      <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
                      Not this time
                    </button>
                    <button
                      onClick={() => setProfileOpen(true)}
                      className={cn(
                        "group h-12 rounded-full bg-secondary/40 hover:bg-secondary",
                        "text-sm font-medium transition-all duration-300 hover:-translate-y-0.5",
                        "flex items-center justify-center gap-2 text-foreground",
                      )}
                    >
                      View full profile
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center pt-1">
                    Take your time. Decisions stay private until matched.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-sunset shadow-glow mb-6">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="font-serif text-4xl">That's all for today</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              You marked <span className="text-foreground font-medium">{interestedCount}</span> introduction{interestedCount === 1 ? "" : "s"} as interesting.
              We'll let you know if any feeling is mutual. Five new matches arrive tomorrow morning.
            </p>
            <Button asChild className="mt-8 rounded-full" size="lg">
              <Link to="/">Return home</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Subtle skip/interest feedback toast */}
      {feedback && !celebrate && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="px-6 py-4 rounded-2xl shadow-glow backdrop-blur bg-background/90 border border-border/70 animate-scale-in flex items-center gap-3">
            {feedback === "interested" ? (
              <><Heart className="h-5 w-5 text-primary fill-primary" /><span className="font-medium">Interest noted, gently.</span></>
            ) : (
              <><X className="h-5 w-5 text-muted-foreground" /><span className="font-medium">Skipped. On to the next.</span></>
            )}
          </div>
        </div>
      )}

      {celebrate && (
        <MatchCelebration
          name={celebrate.name}
          photo={celebrate.gallery.find(g => !g.blurred)?.url ?? celebrate.photo}
          onClose={() => {
            setCelebrate(null);
            advance();
          }}
        />
      )}

      <FullProfileDialog open={profileOpen} onOpenChange={setProfileOpen} profile={fullProfile} />
    </main>
  );
};

export default DailyMatches;
