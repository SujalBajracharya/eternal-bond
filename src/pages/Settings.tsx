import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Eye,
  Lock,
  Phone,
  Users2,
  Bell,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Check,
  Music2,
  Play,
  Pause,
  BadgeCheck,
  Heart,
  Palette,
  MessageCircle,
  Crown,
  Plus,
  Mail,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import match1 from "@/assets/match-1.jpg";
import match2 from "@/assets/match-2.jpg";
import match3 from "@/assets/match-3.jpg";
import match4 from "@/assets/match-4.jpg";

type SectionId =
  | "profile"
  | "photos"
  | "contact"
  | "family"
  | "notifications"
  | "personalization"
  | "safety";

const SECTIONS: { id: SectionId; label: string; icon: any; hint: string }[] = [
  {
    id: "profile",
    label: "Profile & Account",
    icon: User,
    hint: "Your basics",
  },
  { id: "photos", label: "Photo Privacy", icon: Eye, hint: "Who sees what" },
  {
    id: "contact",
    label: "Contact Preferences",
    icon: Phone,
    hint: "How to be reached",
  },
  {
    id: "family",
    label: "Family Involvement",
    icon: Users2,
    hint: "Guardians & roles",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    hint: "Quiet by default",
  },
  {
    id: "personalization",
    label: "Personalization",
    icon: Sparkles,
    hint: "Make it yours",
  },
  {
    id: "safety",
    label: "Safety & Verification",
    icon: ShieldCheck,
    hint: "Trust signals",
  },
];

// ——— Reusable shells ———
const Surface = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "relative rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-card overflow-hidden",
      className,
    )}
  >
    {children}
  </section>
);

const SectionHeader = ({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: any;
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-4 p-7 pb-5">
    <div className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-blush text-primary-deep shadow-soft shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
        {eyebrow}
      </div>
      <h2 className="font-serif text-2xl mt-1 leading-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
        {description}
      </p>
    </div>
  </div>
);

const Row = ({
  title,
  hint,
  children,
  onClick,
}: {
  title: string;
  hint?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center justify-between gap-5 px-7 py-4 transition-colors",
      onClick && "cursor-pointer hover:bg-secondary/30",
    )}
  >
    <div className="min-w-0">
      <div className="text-sm font-medium">{title}</div>
      {hint && (
        <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Divider = () => <div className="mx-7 h-px bg-border/60" />;

// ——— Photo Privacy ———
const PHOTOS = [match1, match2, match3, match4];

const PhotoPrivacySection = () => {
  const [vis, setVis] = useState<("visible" | "blurred")[]>([
    "visible",
    "visible",
    "blurred",
    "blurred",
  ]);
  const visibleCount = vis.filter((v) => v === "visible").length;
  const MIN = 2;
  const setOne = (i: number, v: "visible" | "blurred") => {
    if (v === "blurred" && visibleCount <= MIN) return;
    setVis((p) => p.map((x, idx) => (idx === i ? v : x)));
  };
  return (
    <Surface>
      <SectionHeader
        icon={Eye}
        eyebrow="Privacy"
        title="Photo Privacy"
        description="Choose what stays open and what stays gentle. At least two photos remain visible so others can recognize you."
      />
      <div className="px-7 pb-7 space-y-3">
        {PHOTOS.map((url, i) => {
          const v = vis[i];
          return (
            <div
              key={url}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/60 p-3 transition-all hover:border-primary/40"
            >
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-secondary/40">
                <img
                  src={url}
                  alt=""
                  className={cn(
                    "w-full h-full object-cover transition-all duration-500",
                    v === "blurred" && "blur-md scale-110",
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  Photo {i + 1}
                  {i === 0 && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">
                      Main
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {v === "visible"
                    ? "Anyone viewing your profile can see this."
                    : "Softly blurred until you both connect."}
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-secondary/60 p-1 shrink-0">
                <button
                  onClick={() => setOne(i, "visible")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    v === "visible"
                      ? "bg-card shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Visible</span>
                </button>
                <button
                  onClick={() => setOne(i, "blurred")}
                  disabled={v === "visible" && visibleCount <= MIN}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-40",
                    v === "blurred"
                      ? "bg-card shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Blurred</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Live preview */}
        <div className="rounded-2xl border border-border/60 bg-gradient-blush p-5 mt-4">
          <div className="flex items-baseline justify-between mb-3">
            <h4 className="font-serif text-base">How others see you</h4>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Live preview
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {PHOTOS.map((url, i) => (
              <div
                key={`p-${url}`}
                className="relative aspect-square rounded-xl overflow-hidden bg-secondary/40"
              >
                <img
                  src={url}
                  alt=""
                  className={cn(
                    "w-full h-full object-cover transition-all duration-700",
                    vis[i] === "blurred" && "blur-xl scale-125",
                  )}
                />
                {vis[i] === "blurred" && (
                  <div className="absolute inset-0 grid place-items-center">
                    <Lock className="w-4 h-4 text-foreground/70" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {visibleCount} of {PHOTOS.length} visible ·{" "}
            {PHOTOS.length - visibleCount} kept private until a mutual match.
          </p>
        </div>
      </div>
    </Surface>
  );
};

// ——— Contact Preferences ———
const ContactSection = () => {
  const [mode, setMode] = useState<"user" | "family" | "hybrid">("hybrid");
  const opts = [
    {
      id: "user",
      label: "User-only contact",
      hint: "Only you receive messages and interest notifications.",
      icon: User,
    },
    {
      id: "family",
      label: "Family-first contact",
      hint: "Your designated family members are notified before you, ensuring matches are reviewed together.",
      icon: Users2,
    },
    {
      id: "hybrid",
      label: "Hybrid contact",
      hint: "Both you and your family receive messages — a balanced, transparent approach.",
      icon: Heart,
    },
  ] as const;
  return (
    <Surface>
      <SectionHeader
        icon={Phone}
        eyebrow="Reach"
        title="Contact Preferences"
        description="Decide how families and individuals can reach you. Change this anytime."
      />
      <div className="px-7 pb-7 grid gap-3">
        {opts.map((o) => {
          const active = mode === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setMode(o.id)}
              className={cn(
                "text-left flex items-start gap-4 rounded-2xl border p-4 transition-all",
                active
                  ? "border-primary/60 bg-primary/5 shadow-soft"
                  : "border-border/60 bg-background/60 hover:border-primary/30",
              )}
            >
              <div
                className={cn(
                  "grid place-items-center w-10 h-10 rounded-xl shrink-0 transition-colors",
                  active
                    ? "bg-gradient-sunset text-white"
                    : "bg-secondary/60 text-foreground",
                )}
              >
                <o.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{o.label}</span>
                  {active && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {o.hint}
                </p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 mt-1 transition-colors",
                  active ? "border-primary bg-primary" : "border-border",
                )}
              >
                {active && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Surface>
  );
};

// ——— Family ———
const FamilySection = () => {
  const family = [
    { name: "Anita Sharma", role: "Mother", status: "Active" },
    { name: "Rakesh Sharma", role: "Father", status: "Active" },
    { name: "Priya Sharma", role: "Sister", status: "View-only" },
  ];
  return (
    <Surface>
      <SectionHeader
        icon={Users2}
        eyebrow="Together"
        title="Family Involvement"
        description="Bring your loved ones along respectfully. They can review matches and join conversations within boundaries you set."
      />
      <div className="px-7 pb-7 space-y-3">
        {family.map((f) => (
          <div
            key={f.name}
            className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/60 p-4"
          >
            <div className="grid place-items-center w-11 h-11 rounded-full bg-gradient-blush font-serif text-base text-primary-deep shrink-0">
              {f.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {f.role}
              </div>
            </div>
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full",
                f.status === "Active"
                  ? "bg-sage/20 text-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {f.status}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
        <button className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-background/40 py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
          <Plus className="w-4 h-4" /> Invite a family member
        </button>
      </div>
    </Surface>
  );
};

// ——— Notifications ———
const NotificationsSection = () => {
  const groups: {
    title: string;
    items: { label: string; hint: string; defaultOn?: boolean }[];
  }[] = [
    {
      title: "Matches",
      items: [
        {
          label: "Daily curated set is ready",
          hint: "A gentle nudge each morning.",
          defaultOn: true,
        },
        {
          label: "Mutual interest",
          hint: "When you and someone both express interest.",
          defaultOn: true,
        },
      ],
    },
    {
      title: "Conversations",
      items: [
        {
          label: "New messages",
          hint: "Only from active conversations.",
          defaultOn: true,
        },
        {
          label: "Expiring connections",
          hint: "A soft reminder before they close.",
          defaultOn: false,
        },
      ],
    },
    {
      title: "Family activity",
      items: [
        {
          label: "Family member reviewed a profile",
          hint: "",
          defaultOn: true,
        },
        { label: "Family suggestion", hint: "", defaultOn: false },
      ],
    },
  ];
  return (
    <Surface>
      <SectionHeader
        icon={Bell}
        eyebrow="Calm"
        title="Notifications"
        description="Quiet by default. Turn on only what truly matters to you."
      />
      <div className="pb-4">
        {groups.map((g, gi) => (
          <div key={g.title}>
            <div className="px-7 pt-5 pb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {g.title}
            </div>
            {g.items.map((it) => (
              <Row key={it.label} title={it.label} hint={it.hint || undefined}>
                <Switch defaultChecked={it.defaultOn} />
              </Row>
            ))}
            {gi < groups.length - 1 && <Divider />}
          </div>
        ))}
      </div>
    </Surface>
  );
};

// ——— Personalization ———
const BORDERS = [
  { id: "none", label: "None", className: "ring-1 ring-border" },
  { id: "blush", label: "Blush", className: "ring-2 ring-primary/40" },
  { id: "gold", label: "Gold", className: "ring-2 ring-accent" },
  { id: "plum", label: "Plum", className: "ring-2 ring-plum" },
];
const THEMES = [
  { id: "blush", label: "Blush", swatch: "bg-gradient-blush" },
  { id: "sage", label: "Sage", swatch: "bg-sage/30" },
  { id: "sand", label: "Sand", swatch: "bg-secondary" },
  { id: "ivory", label: "Ivory", swatch: "bg-background" },
];

const PersonalizationSection = () => {
  const [border, setBorder] = useState("blush");
  const [theme, setTheme] = useState("blush");
  const [mood, setMood] = useState("Reading poetry on quiet evenings");
  const [playing, setPlaying] = useState(false);
  return (
    <Surface>
      <SectionHeader
        icon={Sparkles}
        eyebrow="You"
        title="Personalization"
        description="A few gentle touches to make your profile feel like yours."
      />
      <div className="px-7 pb-7 space-y-7">
        {/* Profile border */}
        <div>
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-accent" /> Profile border
          </div>
          <div className="flex flex-wrap gap-4">
            {BORDERS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBorder(b.id)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-transform",
                  border === b.id && "scale-105",
                )}
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full overflow-hidden p-0.5 transition-all",
                    b.className,
                    border === b.id && "shadow-soft",
                  )}
                >
                  <img
                    src={match1}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px]",
                    border === b.id
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood line */}
        <div>
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <Smile className="w-4 h-4 text-primary" /> Mood / status line
          </div>
          <Input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="A short line about your current state of mind"
            className="rounded-xl bg-background/60"
            maxLength={80}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Visible on your profile preview</span>
            <span>{mood.length}/80</span>
          </div>
        </div>

        {/* Chat theme */}
        <div>
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-plum" /> Chat theme
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all",
                  theme === t.id
                    ? "border-primary/60 shadow-soft"
                    : "border-border/60 hover:border-primary/30",
                )}
              >
                <div className={cn("h-14 rounded-xl mb-2", t.swatch)} />
                <div className="text-xs font-medium flex items-center justify-between">
                  {t.label}
                  {theme === t.id && (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Favorite song */}
        <div>
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <Music2 className="w-4 h-4 text-primary-deep" /> Current favorite
            song
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-blush p-4">
            <div className="relative w-14 h-14 rounded-xl bg-gradient-sunset shrink-0 grid place-items-center shadow-soft">
              <Music2 className="w-5 h-5 text-white" />
              {playing && (
                <span className="absolute inset-0 rounded-xl ring-2 ring-primary/40 animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Tum Hi Ho</div>
              <div className="text-xs text-muted-foreground truncate">
                Arijit Singh · Aashiqui 2
              </div>
              <div className="mt-2 h-1 rounded-full bg-background/60 overflow-hidden">
                <div
                  className={cn(
                    "h-full bg-gradient-sunset transition-all",
                    playing ? "w-2/3" : "w-1/4",
                  )}
                />
              </div>
            </div>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="grid place-items-center w-10 h-10 rounded-full bg-card shadow-soft hover:scale-105 transition-transform"
            >
              {playing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Surface>
  );
};

// ——— Safety ———
const SafetySection = () => {
  const items = [
    {
      label: "Email",
      status: "verified",
      hint: "priya@example.com",
      icon: Mail,
    },
    {
      label: "Phone number",
      status: "verified",
      hint: "+91 ••••• 4521",
      icon: Phone,
    },
    {
      label: "Government ID",
      status: "pending",
      hint: "Submitted 2 days ago — usually reviewed within 48 hours.",
      icon: BadgeCheck,
    },
    {
      label: "Photo authenticity",
      status: "unverified",
      hint: "A short live selfie helps families trust your profile.",
      icon: User,
    },
  ];
  return (
    <Surface>
      <SectionHeader
        icon={ShieldCheck}
        eyebrow="Trust"
        title="Safety & Verification"
        description="Verification is gentle and optional. Each layer you complete builds quiet confidence with families."
      />
      <div className="px-7 pb-7 space-y-3">
        {items.map((it) => {
          const tone =
            it.status === "verified"
              ? "bg-sage/20 text-foreground"
              : it.status === "pending"
                ? "bg-accent/20 text-accent-foreground"
                : "bg-secondary text-muted-foreground";
          return (
            <div
              key={it.label}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/60 p-4"
            >
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-secondary/60 shrink-0">
                <it.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{it.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {it.hint}
                </div>
              </div>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full",
                  tone,
                )}
              >
                {it.status}
              </span>
              {it.status !== "verified" && (
                <button className="text-xs font-medium px-3 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity">
                  {it.status === "pending" ? "View" : "Verify"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Surface>
  );
};

// ——— Profile & Account ———
const ProfileSection = () => (
  <Surface>
    <SectionHeader
      icon={User}
      eyebrow="Account"
      title="Profile & Account"
      description="Your essentials — kept in one calm place."
    />
    <div className="pb-4">
      <Row title="Full name" hint="Priya Sharma" onClick={() => {}}>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Row>
      <Divider />
      <Row title="Date of birth" hint="14 March 1996" onClick={() => {}}>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Row>
      <Divider />
      <Row title="Location" hint="Kathmandu, Nepal" onClick={() => {}}>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Row>
      <Divider />
      <Row title="Email" hint="priya@example.com">
        <span className="text-xs text-sage flex items-center gap-1">
          <BadgeCheck className="w-3.5 h-3.5" /> Verified
        </span>
      </Row>
      <Divider />
      <Row title="Language" hint="English (India)" onClick={() => {}}>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Row>
    </div>
  </Surface>
);

// ——— Page ———
const Settings = () => {
  const [active, setActive] = useState<SectionId>("profile");

  const renderSection = () => {
    switch (active) {
      case "profile":
        return <ProfileSection />;
      case "photos":
        return <PhotoPrivacySection />;
      case "contact":
        return <ContactSection />;
      case "family":
        return <FamilySection />;
      case "notifications":
        return <NotificationsSection />;
      case "personalization":
        return <PersonalizationSection />;
      case "safety":
        return <SafetySection />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-blush">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/60">
        <div className="container max-w-6xl flex items-center justify-between py-4">
          <Link
            to="/today"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Your space
            </div>
            <h1 className="font-serif text-lg leading-tight">
              Settings & Privacy
            </h1>
          </div>
          <Link
            to="/matches"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Conversations</span>
          </Link>
        </div>
      </header>

      <div className="container max-w-6xl py-8 lg:py-12">
        {/* Hero */}
        <div className="mb-8 lg:mb-10 max-w-2xl animate-fade-in">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary-deep">
            Privacy-first by design
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl mt-2 leading-tight">
            Quiet controls for a meaningful matrimonial journey.
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Every setting here is built around respect — for you, your family,
            and the people you may meet. Adjust anything, anytime.
          </p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-2 shadow-soft">
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all",
                      isActive
                        ? "bg-gradient-blush shadow-soft"
                        : "hover:bg-secondary/40",
                    )}
                  >
                    <div
                      className={cn(
                        "grid place-items-center w-9 h-9 rounded-xl shrink-0 transition-colors",
                        isActive
                          ? "bg-card text-primary-deep"
                          : "bg-secondary/60 text-foreground",
                      )}
                    >
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-sm leading-tight",
                          isActive ? "font-medium" : "",
                        )}
                      >
                        {s.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {s.hint}
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 rounded-3xl border border-border/60 bg-gradient-warm p-5 text-sm leading-relaxed shadow-soft">
              <ShieldCheck className="w-5 h-5 text-primary-deep mb-2" />
              <p className="font-serif text-base leading-snug">
                Your privacy is sacred.
              </p>
              <p className="text-xs text-foreground/70 mt-2">
                We never share your details without your consent. Conversations
                and photos are protected by default.
              </p>
            </div>
          </aside>

          {/* Content */}
          <div key={active} className="animate-fade-in">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
