import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Crown,
  Heart,
  Home as HomeIcon,
  Lock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Users,
  GraduationCap,
  Briefcase,
  Ruler,
  Leaf,
  Star,
  Compass,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const cmToFeet = (cm: number) => {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return `${ft}′ ${inch}″`;
};

type SectionKey =
  | "age"
  | "location"
  | "education"
  | "profession"
  | "community"
  | "lifestyle"
  | "family"
  | "height"
  | "intention"
  | "trust"
  | "compatibility";

type Section = {
  key: SectionKey;
  label: string;
  hint: string;
  Icon: LucideIcon;
  premium?: boolean;
};

const SECTIONS: Section[] = [
  {
    key: "age",
    label: "Age range",
    hint: "A comfortable window",
    Icon: Sparkles,
  },
  {
    key: "height",
    label: "Height range",
    hint: "Optional height preference",
    Icon: Ruler,
  },
  {
    key: "location",
    label: "Location",
    hint: "Cities & relocation readiness",
    Icon: MapPin,
  },
  {
    key: "education",
    label: "Education",
    hint: "Qualification preferences",
    Icon: GraduationCap,
  },
  {
    key: "profession",
    label: "Profession",
    hint: "Fields & sectors",
    Icon: Briefcase,
  },
  {
    key: "community",
    label: "Religion & community",
    hint: "Faith and traditions",
    Icon: HomeIcon,
  },
  {
    key: "intention",
    label: "Relationship intention",
    hint: "Marriage timeline",
    Icon: Heart,
  },
  {
    key: "trust",
    label: "Verified & family-assisted",
    hint: "Trust signals",
    Icon: ShieldCheck,
  },
  {
    key: "lifestyle",
    label: "Lifestyle deep-match",
    hint: "Diet, habits, values",
    Icon: Leaf,
    premium: true,
  },
  {
    key: "family",
    label: "Family values & compatibility",
    hint: "Family priorities",
    Icon: Users,
    premium: true,
  },
  {
    key: "compatibility",
    label: "Compatibility intelligence",
    hint: "Smart match scoring",
    Icon: Star,
    premium: true,
  },
];

const PRESETS = [
  { name: "My ideal match", count: 142 },
  { name: "Open & nearby", count: 318 },
  { name: "Family-aligned", count: 87 },
];

const PILL = "rounded-full border px-3 py-1 text-xs transition-colors";

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        PILL,
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card/75 text-foreground/75 hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-muted/50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3.5 py-1 text-xs transition-all",
            value === o.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function LockedOverlay() {
  const navigate = useNavigate();
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/5 backdrop-blur-[5px] rounded-2xl">
      <div className="mx-4 flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-primary/15 bg-card/95 p-5 text-center shadow-card">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-sunset text-white">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-serif text-sm font-medium text-foreground">
            Available with Premium
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Refine matches with deeper lifestyle & compatibility signals.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("/premium")}
          className="rounded-full bg-gradient-sunset text-white text-xs px-6 hover:opacity-95 mt-1"
        >
          Unlock Premium
        </Button>
      </div>
    </div>
  );
}

export default function Filters() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<SectionKey | null>(null);
  const [radius, setRadius] = useState(160);

  // states matching original Filter.tsx
  const [age, setAge] = useState<number[]>([26, 32]);
  const [height, setHeight] = useState<number[]>([160, 180]);
  const [cities, setCities] = useState<string[]>(["Bengaluru", "Pune"]);
  const [relocate, setRelocate] = useState<string>("open");
  const [educ, setEduc] = useState<string[]>(["Postgraduate"]);
  const [prof, setProf] = useState<string[]>(["Tech & engineering"]);
  const [faith, setFaith] = useState<string>("Hindu");
  const [intention, setIntention] = useState<string>("Within a year");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [familyAssisted, setFamilyAssisted] = useState(false);

  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

  // Fetch preferences from Spring Boot backend on mount
  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/preferences`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            Accept: "application/json",
          },
        });

        if (res.status === 204) {
          // No preferences saved yet — keep defaults
          console.log("[Filters] No saved preferences found, using defaults.");
          return;
        }

        if (!res.ok) {
          console.error("[Filters] Failed to fetch preferences:", res.status, await res.text());
          return;
        }

        const data = await res.json();
        console.log("[Filters] Fetched active preferences from backend:", data);

        if (data.prefAgeMin != null && data.prefAgeMax != null) {
          setAge([data.prefAgeMin, data.prefAgeMax]);
        }
        if (data.prefHeightMin != null && data.prefHeightMax != null) {
          setHeight([data.prefHeightMin, data.prefHeightMax]);
        }
        if (data.prefLocation) {
          setCities(data.prefLocation.split(",").map((s: string) => s.trim()).filter(Boolean));
        } else {
          setCities([]);
        }
        setRelocate(data.prefRelocate ?? "any");
        if (data.prefEducation) {
          setEduc(data.prefEducation.split(",").map((s: string) => s.trim()).filter(Boolean));
        } else {
          setEduc([]);
        }
        if (data.prefProfession) {
          setProf(data.prefProfession.split(",").map((s: string) => s.trim()).filter(Boolean));
        } else {
          setProf([]);
        }
        setFaith(data.prefReligion ?? "No preference");
        setIntention(data.prefIntention ?? "When right");
        setVerifiedOnly(!!data.prefVerifiedOnly);
        setFamilyAssisted(!!data.prefFamilyAssisted);
      } catch (err) {
        console.error("[Filters] Error fetching preferences:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [session]);

  // Save preferences to Spring Boot backend
  const savePreferences = async (customPresetName = "default") => {
    if (!session?.access_token) {
      toast.error("Please sign in to save preferences.");
      return;
    }

    const payload = {
      presetName: customPresetName,
      isActive: true,
      prefAgeMin: age[0],
      prefAgeMax: age[1],
      prefHeightMin: height[0],
      prefHeightMax: height[1],
      prefLocation: cities.join(","),
      prefRelocate: relocate,
      prefEducation: educ.join(","),
      prefProfession: prof.join(","),
      prefReligion: faith,
      prefIntention: intention,
      prefVerifiedOnly: verifiedOnly,
      prefFamilyAssisted: familyAssisted,
    };

    console.log("[Filters] Saving preferences to backend:", payload);

    try {
      const res = await fetch(`${API_BASE}/api/preferences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[Filters] Save failed:", res.status, text);
        toast.error("Failed to save preferences.");
      } else {
        const saved = await res.json();
        console.log("[Filters] Preferences saved successfully:", saved);
      }
    } catch (err) {
      console.error("[Filters] Network error saving preferences:", err);
      toast.error("Network error — preferences not saved.");
    }
  };

  // Log filter data whenever it changes
  useEffect(() => {
    console.log("Current filter states:", {
      age,
      height: { minCm: height[0], maxCm: height[1], minFeet: cmToFeet(height[0]), maxFeet: cmToFeet(height[1]) },
      cities,
      relocate,
      educ,
      prof,
      faith,
      intention,
      verifiedOnly,
      familyAssisted
    });
  }, [age, height, cities, relocate, educ, prof, faith, intention, verifiedOnly, familyAssisted]);

  const isPremium = false; // demo default

  // radius adaptation
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setRadius(w < 480 ? 110 : w < 768 ? 135 : w < 1024 ? 150 : 175);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.title = "Compatibility Constellation — EternalBond";
  }, []);

  // active filters count
  const activeCount = useMemo(() => {
    let count = 0;
    if (age[0] !== 21 || age[1] !== 50) count++;
    if (height[0] !== 140 || height[1] !== 200) count++;
    if (cities.length > 0) count++;
    if (relocate !== "any") count++;
    if (educ.length > 0) count++;
    if (prof.length > 0) count++;
    if (faith !== "No preference") count++;
    if (intention !== "When right") count++;
    if (verifiedOnly) count++;
    if (familyAssisted) count++;
    return count;
  }, [
    age,
    height,
    cities,
    relocate,
    educ,
    prof,
    faith,
    intention,
    verifiedOnly,
    familyAssisted,
  ]);

  // checks if a category is modified / completed
  const isCompleted = (key: SectionKey) => {
    switch (key) {
      case "age":
        return age[0] !== 21 || age[1] !== 50;
      case "height":
        return height[0] !== 140 || height[1] !== 200;
      case "location":
        return cities.length > 0 || relocate !== "any";
      case "education":
        return educ.length > 0;
      case "profession":
        return prof.length > 0;
      case "community":
        return faith !== "No preference";
      case "intention":
        return intention !== "When right";
      case "trust":
        return verifiedOnly || familyAssisted;
      default:
        return false;
    }
  };

  // dynamic match count formula matching original Filters
  const matchCount = useMemo(() => {
    const base = 420;
    const ageW = (age[1] - age[0]) * 6;
    const cityW = cities.length * 24;
    const verW = verifiedOnly ? -40 : 0;
    return Math.max(28, base + ageW + cityW + verW);
  }, [age, cities, verifiedOnly]);

  // reset all filters
  const clearAllFilters = () => {
    setAge([21, 50]);
    setHeight([140, 200]);
    setCities([]);
    setRelocate("any");
    setEduc([]);
    setProf([]);
    setFaith("No preference");
    setIntention("When right");
    setVerifiedOnly(false);
    setFamilyAssisted(false);
    toast.success("Compatibility preferences cleared");
  };

  // reset a specific category
  const resetCategory = (key: SectionKey) => {
    switch (key) {
      case "age":
        setAge([21, 50]);
        break;
      case "height":
        setHeight([140, 200]);
        break;
      case "location":
        setCities([]);
        setRelocate("any");
        break;
      case "education":
        setEduc([]);
        break;
      case "profession":
        setProf([]);
        break;
      case "community":
        setFaith("No preference");
        break;
      case "intention":
        setIntention("When right");
        break;
      case "trust":
        setVerifiedOnly(false);
        setFamilyAssisted(false);
        break;
      default:
        break;
    }
    toast.success(`Reset ${SECTIONS.find((s) => s.key === key)?.label}`);
  };

  const toggleIn = (list: string[], v: string, set: (x: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // load specific presets
  const loadPreset = (name: string) => {
    if (name === "My ideal match") {
      setAge([26, 32]);
      setHeight([160, 180]);
      setCities(["Bengaluru", "Pune"]);
      setRelocate("open");
      setEduc(["Postgraduate"]);
      setProf(["Tech & engineering"]);
      setFaith("Hindu");
      setIntention("Within a year");
      setVerifiedOnly(true);
      setFamilyAssisted(false);
      toast.success("Loaded preset: My ideal match");
    } else if (name === "Open & nearby") {
      setAge([24, 35]);
      setHeight([150, 190]);
      setCities([]);
      setRelocate("open");
      setEduc([]);
      setProf([]);
      setFaith("No preference");
      setIntention("When right");
      setVerifiedOnly(false);
      setFamilyAssisted(false);
      toast.success("Loaded preset: Open & nearby");
    } else if (name === "Family-aligned") {
      setAge([25, 30]);
      setHeight([155, 185]);
      setCities(["Mumbai"]);
      setRelocate("any");
      setEduc(["Graduate", "Postgraduate"]);
      setProf([]);
      setFaith("Hindu");
      setIntention("Soon");
      setVerifiedOnly(true);
      setFamilyAssisted(true);
      toast.success("Loaded preset: Family-aligned");
    }
  };

  // constellation math: coordinate list
  const sectionCoords = useMemo(() => {
    return SECTIONS.map((_, i) => {
      const angle = (i / SECTIONS.length) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }, [radius]);

  const stars = useMemo(
    () =>
      Array.from({ length: 60 }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.5 + 0.5,
        delay: Math.random() * 5,
        dur: 3.5 + Math.random() * 4,
      })),
    [],
  );

  // render input controls for active selection
  const renderInputs = (key: SectionKey) => {
    switch (key) {
      case "age":
        return (
          <div className="pt-1">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                Comfortable range
              </span>
              <span className="font-serif text-base text-foreground">
                {age[0]} – {age[1]} yrs
              </span>
            </div>
            <Slider
              value={age}
              onValueChange={setAge}
              min={21}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>
        );
      case "height":
        return (
          <div className="pt-1">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                Height range
              </span>
              <span className="font-serif text-base text-foreground">
                {cmToFeet(height[0])} – {cmToFeet(height[1])}
              </span>
            </div>
            <Slider
              value={height}
              onValueChange={setHeight}
              min={140}
              max={200}
              step={1}
              className="mt-2"
            />
          </div>
        );
      case "location":
        return (
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Preferred cities
              </label>
              <Input
                placeholder="Add a city & press Enter"
                onKeyDown={(e) => {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (e.key === "Enter" && v) {
                    setCities([...new Set([...cities, v])]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
                className="mt-1.5 rounded-2xl border-border bg-background/60"
              />
              <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {cities.map((c) => (
                  <Chip
                    key={c}
                    active
                    onClick={() => setCities(cities.filter((x) => x !== c))}
                  >
                    {c} ×
                  </Chip>
                ))}
                {cities.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">
                    No cities listed yet.
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Open to relocate
              </label>
              <Segmented
                value={relocate}
                onChange={setRelocate}
                options={[
                  { value: "open", label: "Open" },
                  { value: "no", label: "Prefer not" },
                  { value: "any", label: "No preference" },
                ]}
              />
            </div>
          </div>
        );
      case "education":
        return (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Graduate",
              "Postgraduate",
              "Doctorate",
              "Professional degree",
            ].map((v) => (
              <Chip
                key={v}
                active={educ.includes(v)}
                onClick={() => toggleIn(educ, v, setEduc)}
              >
                {v}
              </Chip>
            ))}
          </div>
        );
      case "profession":
        return (
          <div className="flex flex-wrap gap-1.5 pt-1 max-h-40 overflow-y-auto">
            {[
              "Tech & engineering",
              "Medicine",
              "Finance",
              "Design & creative",
              "Education",
              "Entrepreneur",
              "Civil services",
            ].map((v) => (
              <Chip
                key={v}
                active={prof.includes(v)}
                onClick={() => toggleIn(prof, v, setProf)}
              >
                {v}
              </Chip>
            ))}
          </div>
        );
      case "community":
        return (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Hindu",
              "Muslim",
              "Christian",
              "Sikh",
              "Jain",
              "Buddhist",
              "No preference",
            ].map((v) => (
              <Chip key={v} active={faith === v} onClick={() => setFaith(v)}>
                {v}
              </Chip>
            ))}
          </div>
        );
      case "intention":
        return (
          <div className="pt-1">
            <Segmented
              value={intention}
              onChange={setIntention}
              options={[
                { value: "Soon", label: "Soon" },
                { value: "Within a year", label: "Within a year" },
                { value: "When right", label: "When it feels right" },
              ]}
            />
          </div>
        );
      case "trust":
        return (
          <div className="space-y-3 pt-1">
            <Row
              icon={<ShieldCheck className="h-4 w-4 text-sage" />}
              title="Verified profiles only"
              subtitle="ID and photo verified members"
              checked={verifiedOnly}
              onChange={setVerifiedOnly}
            />
            <Row
              icon={<Users className="h-4 w-4 text-plum" />}
              title="Family-assisted profiles"
              subtitle="Created or managed with family"
              checked={familyAssisted}
              onChange={setFamilyAssisted}
            />
          </div>
        );
      case "lifestyle":
        return (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Vegetarian",
              "Non-drinker",
              "Yoga & wellness",
              "Spiritual",
              "Outdoorsy",
              "Homebody",
            ].map((v) => (
              <Chip key={v} active={true}>
                {v}
              </Chip>
            ))}
          </div>
        );
      case "family":
        return (
          <div className="space-y-2 pt-1">
            <Chip active>Close-knit family</Chip>
            <Chip active={false}>Traditional values</Chip>
            <Chip active={false}>Progressive household</Chip>
            <Chip active={false}>Joint family open</Chip>
          </div>
        );
      case "compatibility":
        return (
          <div className="pt-1 space-y-3">
            <Row
              icon={<Star className="h-4 w-4 text-accent" />}
              title="Compatibility-based matching"
              subtitle="Rank matches by deep alignment score"
              checked={false}
              onChange={() => {}}
            />
            <Row
              icon={<Heart className="h-4 w-4 text-primary" />}
              title="“Serious about marriage” signal"
              subtitle="Prioritise intent-aligned profiles"
              checked={false}
              onChange={() => {}}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070509] relative overflow-hidden">
        {/* Stellar Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(122,31,43,0.15)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,161,90,0.1)_0%,transparent_50%)]" />
        
        <div className="text-center relative z-10 space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            {/* Inner spinning star */}
            <div className="absolute inset-0 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            {/* Orbiting star */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full animate-ping" />
            <Compass className="w-10 h-10 text-primary absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-lg tracking-wide text-foreground">Aligning the Heavens</h2>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Reading your Constellation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background grain overflow-x-hidden relative pb-32"
      style={{
        background:
          "radial-gradient(circle at 50% 30%, hsl(14 90% 97%) 0%, hsl(36 70% 97%) 50%, hsl(36 60% 94%) 100%)",
      }}
    >
      {/* Background elements & washing */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 left-1/4 w-[38rem] h-[38rem] rounded-full opacity-25 blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, hsl(6 90% 70% / 0.18), transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-[32rem] h-[32rem] rounded-full opacity-20 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, hsl(38 88% 65% / 0.15), transparent 60%)",
          }}
        />
      </div>

      {/* Twinkling stars */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-primary/15"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid h-9 w-9 place-items-center rounded-full border border-border/80 bg-card text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">
                Compatibility compass
              </span>
              <h1 className="font-serif text-xl md:text-2xl text-foreground leading-none mt-1">
                Alignment preferences
              </h1>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="rounded-full text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground font-medium"
          >
            Clear all
          </Button>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pt-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Section: Summary & Presets */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-3xl border border-border/70 bg-card/85 backdrop-blur-md p-5 shadow-soft">
              <h2 className="font-serif text-lg text-foreground mb-1">
                Preferences summary
              </h2>
              <p className="text-xs text-muted-foreground">
                Your criteria mapping
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                  <span className="text-muted-foreground">
                    Active parameters
                  </span>
                  <span className="font-serif text-lg text-primary font-medium">
                    {activeCount}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                  <span className="text-muted-foreground">Match alignment</span>
                  <span className="font-serif text-sm text-foreground">
                    {activeCount > 3 ? "94% targeted" : "Broad search"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground/80 mt-4 leading-normal">
                Focus is currently placed on verified profiles, education, and
                specific cultural backgrounds.
              </p>
            </div>

            {/* Presets */}
            <div className="rounded-3xl border border-border/70 bg-card/85 backdrop-blur-md p-5 shadow-soft">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                <Bookmark className="h-3.5 w-3.5 text-primary" /> Saved presets
              </div>
              <div className="space-y-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => loadPreset(p.name)}
                    className="w-full text-left flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 hover:bg-background/80 transition-colors px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-medium text-foreground">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {p.count} matches
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Section: Compatibility Constellation */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[460px] md:min-h-[500px]">
            <div
              className="relative flex items-center justify-center transition-all duration-300"
              style={{
                width: radius * 2 + 180,
                height: radius * 2 + 180,
                maxWidth: "100vw",
              }}
            >
              {/* Orbit ring */}
              <div
                aria-hidden
                className="absolute rounded-full border border-primary/5 pointer-events-none"
                style={{
                  width: radius * 2,
                  height: radius * 2,
                  borderStyle: "dashed",
                }}
              />

              {/* SVG Connection Lines */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="-250 -250 500 500"
                aria-hidden
              >
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop
                      offset="0%"
                      stopColor="hsl(6 86% 64%)"
                      stopOpacity="0.02"
                    />
                    <stop
                      offset="50%"
                      stopColor="hsl(38 88% 60%)"
                      stopOpacity="0.4"
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(6 86% 64%)"
                      stopOpacity="0.02"
                    />
                  </linearGradient>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(38 88% 60%)"
                      stopOpacity="0.25"
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(6 86% 64%)"
                      stopOpacity="0.1"
                    />
                  </linearGradient>
                </defs>

                {/* Spoke Lines */}
                {sectionCoords.map((p, i) => (
                  <motion.line
                    key={`spoke-${i}`}
                    x1={0}
                    y1={0}
                    x2={p.x}
                    y2={p.y}
                    stroke="url(#lineGrad)"
                    strokeWidth={1.5}
                    strokeDasharray="3 5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      duration: 1,
                      delay: i * 0.08,
                      ease: "easeOut",
                    }}
                  />
                ))}

                {/* Perimeter Lines */}
                {sectionCoords.map((p, i) => {
                  const next = sectionCoords[(i + 1) % sectionCoords.length];
                  return (
                    <motion.line
                      key={`perimeter-${i}`}
                      x1={p.x}
                      y1={p.y}
                      x2={next.x}
                      y2={next.y}
                      stroke="url(#ringGrad)"
                      strokeWidth={1}
                      strokeDasharray="2 6"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.6 }}
                      transition={{
                        duration: 1.2,
                        delay: 0.8 + i * 0.05,
                        ease: "easeOut",
                      }}
                    />
                  );
                })}

                {/* Active energy pulse traveling on spokes */}
                {sectionCoords.map((p, i) => {
                  const key = SECTIONS[i].key;
                  if (!isCompleted(key)) return null;
                  return (
                    <motion.circle
                      key={`pulse-${key}`}
                      r={2.2}
                      fill="hsl(38 88% 62%)"
                      style={{
                        filter: "drop-shadow(0 0 3px hsl(38 88% 60% / 0.6))",
                      }}
                      animate={{
                        cx: [p.x, 0, p.x],
                        cy: [p.y, 0, p.y],
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{
                        duration: 4.5 + (i % 2),
                        delay: i * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  );
                })}
              </svg>

              {/* Center Core: Glowing Compatibility Core */}
              <div className="absolute grid place-items-center w-28 h-28 rounded-full pointer-events-none">
                <div
                  className="absolute inset-0 rounded-full animate-core-pulse opacity-40 blur-md"
                  style={{
                    background:
                      "radial-gradient(circle, hsl(6 86% 64% / 0.25), transparent 70%)",
                  }}
                />
                <div
                  className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border backdrop-blur-xl shadow-glow"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, hsl(0 0% 100% / 0.9), hsl(14 80% 92% / 0.95))",
                    borderColor: "hsl(6 86% 64% / 0.25)",
                  }}
                >
                  <Heart className="w-5 h-5 text-primary fill-primary/10 animate-pulse" />
                  <span className="text-[9px] uppercase font-bold tracking-wider text-foreground mt-1 text-center leading-none">
                    Core
                  </span>
                </div>
              </div>

              {/* Orb Stars */}
              {SECTIONS.map((sec, i) => {
                const p = sectionCoords[i];
                const active = isCompleted(sec.key);
                const Icon = sec.Icon;
                return (
                  <button
                    key={sec.key}
                    onClick={() => setActiveCategory(sec.key)}
                    className="absolute group flex flex-col items-center justify-center transition-all duration-300"
                    style={{
                      left: `calc(50% + ${p.x}px - 26px)`,
                      top: `calc(50% + ${p.y}px - 26px)`,
                      width: 52,
                      height: 52,
                    }}
                    title={sec.label}
                  >
                    {/* star light glow halo */}
                    <span
                      className={cn(
                        "absolute inset-0 rounded-full scale-110 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-300",
                        active && "opacity-80",
                      )}
                      style={{
                        background: active
                          ? "radial-gradient(circle, hsl(6 86% 64% / 0.15) 0%, transparent 70%)"
                          : "radial-gradient(circle, hsl(38 88% 60% / 0.1) 0%, transparent 70%)",
                      }}
                    />

                    {/* Outer Star Ring */}
                    <span
                      className={cn(
                        "absolute inset-1 rounded-full border transition-all duration-300",
                        active
                          ? "border-primary/45 shadow-[0_0_8px_hsl(6_86%_64%/_0.3)] animate-star-pulse"
                          : "border-border bg-card/10 group-hover:border-primary/30",
                      )}
                    />

                    {/* Glass orb star */}
                    <span
                      className="relative grid place-items-center w-9 h-9 rounded-full border backdrop-blur-md transition-all duration-300 group-hover:scale-105"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 25%, hsl(0 0% 100% / 0.95), hsl(14 80% 92% / 0.9))",
                        borderColor: active
                          ? "hsl(6 86% 64% / 0.25)"
                          : "hsl(38 88% 60% / 0.15)",
                      }}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          active
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-primary",
                        )}
                        strokeWidth={1.8}
                      />
                    </span>

                    {/* Caption name tooltip (floating) */}
                    <span className="absolute top-[108%] pointer-events-none opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 bg-card/95 border border-border/60 text-[9.5px] uppercase tracking-wider font-semibold text-foreground px-2 py-0.5 rounded-full shadow-soft whitespace-nowrap z-20">
                      {sec.label}
                    </span>

                    {/* Premium marker tiny dot */}
                    {sec.premium && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Interactive floating sheet category editor */}
            <AnimatePresence>
              {activeCategory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute sm:inset-0 bottom-0 top-auto sm:top-0 left-0 right-0 z-40 flex sm:items-center items-end justify-center p-0 sm:p-4 bg-background/40 backdrop-blur-md rounded-t-[2rem] sm:rounded-3xl"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="w-full sm:max-w-md p-6 rounded-t-[2.5rem] sm:rounded-3xl border-t sm:border border-primary/20 bg-card/95 shadow-glow pb-8 sm:pb-6"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-blush text-primary">
                          {(() => {
                            const sec = SECTIONS.find(
                              (s) => s.key === activeCategory,
                            );
                            const Icon = sec?.Icon || Heart;
                            return <Icon className="h-5 w-5" />;
                          })()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-serif text-base text-foreground">
                              {
                                SECTIONS.find((s) => s.key === activeCategory)
                                  ?.label
                              }
                            </h3>
                            {SECTIONS.find((s) => s.key === activeCategory)
                              ?.premium && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-accent-foreground/80">
                                <Crown className="h-2 w-2" /> Premium
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {
                              SECTIONS.find((s) => s.key === activeCategory)
                                ?.hint
                            }
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveCategory(null)}
                        className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground font-semibold px-2 py-1"
                      >
                        Close
                      </button>
                    </div>

                    {/* Inputs area */}
                    <div className="relative py-2 min-h-[90px] flex flex-col justify-center">
                      {SECTIONS.find((s) => s.key === activeCategory)
                        ?.premium && !isPremium ? (
                        <div className="relative w-full min-h-[110px] flex items-center justify-center">
                          <div className="blur-[4px] pointer-events-none select-none opacity-50 w-full">
                            {renderInputs(activeCategory)}
                          </div>
                          <LockedOverlay />
                        </div>
                      ) : (
                        renderInputs(activeCategory)
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end mt-5 gap-2 border-t border-border/40 pt-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resetCategory(activeCategory)}
                        className="rounded-full text-[11px] h-8"
                      >
                        Reset star
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setActiveCategory(null)}
                        className="rounded-full bg-gradient-sunset px-5 text-white text-[11px] h-8"
                      >
                        Align core
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Section: Live Preference Overview & Premium Layer */}
          <div className="lg:col-span-3 space-y-5">
            <div className="rounded-3xl border border-border/70 bg-card/85 backdrop-blur-md p-5 shadow-soft">
              <h2 className="font-serif text-lg text-foreground mb-1">
                Preference structure
              </h2>
              <p className="text-xs text-muted-foreground">
                Premium Matrimonial Classification
              </p>

              <div className="mt-5 space-y-4">
                {/* Deal Breakers */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />{" "}
                    Deal Breakers
                  </div>
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Religion</span>
                      <span className="font-serif text-foreground leading-none">
                        {faith}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        Marriage Intent
                      </span>
                      <span className="font-serif text-foreground leading-none">
                        {intention}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        ID Verified Only
                      </span>
                      <span className="font-serif text-foreground leading-none">
                        {verifiedOnly ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preferred */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />{" "}
                    Preferred
                  </div>
                  <div className="rounded-2xl border border-accent/25 bg-accent/5 p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Age bracket</span>
                      <span className="font-serif text-foreground leading-none">
                        {age[0]} - {age[1]} yrs
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        Height range
                      </span>
                      <span className="font-serif text-foreground leading-none">
                        {cmToFeet(height[0])} - {cmToFeet(height[1])}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-xs gap-3">
                      <span className="text-muted-foreground">Education</span>
                      <span
                        className="font-serif text-foreground text-right leading-none max-w-[140px] truncate"
                        title={educ.join(", ") || "None selected"}
                      >
                        {educ.join(", ") || "None"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-xs gap-3">
                      <span className="text-muted-foreground">
                        Career fields
                      </span>
                      <span
                        className="font-serif text-foreground text-right leading-none max-w-[140px] truncate"
                        title={prof.join(", ") || "None selected"}
                      >
                        {prof.join(", ") || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Open To */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sage">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage" /> Open
                    To
                  </div>
                  <div className="rounded-2xl border border-sage/20 bg-sage/5 p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Relocation</span>
                      <span className="font-serif text-foreground leading-none uppercase">
                        {relocate}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-xs gap-3">
                      <span className="text-muted-foreground">
                        Preferred cities
                      </span>
                      <span
                        className="font-serif text-foreground text-right leading-none max-w-[130px] truncate"
                        title={cities.join(", ") || "No cities"}
                      >
                        {cities.join(", ") || "All cities"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        Family assisted
                      </span>
                      <span className="font-serif text-foreground leading-none">
                        {familyAssisted ? "Willing" : "No preference"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky footer with match count preview */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl text-foreground">
                {matchCount}
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                souls aligned
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Live preview matching your constellation values.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={async () => {
                await savePreferences("My ideal match");
                toast.success("Preset saved to your compass");
              }}
              className="rounded-full text-xs font-semibold h-9"
            >
              <Bookmark className="h-4 w-4 mr-1.5 text-primary" /> Save preset
            </Button>
            <Button
              onClick={async () => {
                await savePreferences("default");
                toast.success("Constellation locked! Returning to matches.");
                navigate("/today");
              }}
              className="rounded-full bg-gradient-sunset px-6 text-white text-xs font-semibold h-9 shadow-soft hover:opacity-95"
            >
              <Check className="h-4 w-4 mr-1.5" /> Show matches
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.35); }
        }
        @keyframes star-pulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(6 86% 64% / 0.35); }
          50% { box-shadow: 0 0 0 4px hsl(6 86% 64% / 0); }
        }
        @keyframes core-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.4; }
          50% { transform: scale(1.08) rotate(180deg); opacity: 0.65; }
        }
        .animate-core-pulse {
          animation: core-pulse 8s ease-in-out infinite;
        }
        .animate-star-pulse {
          animation: star-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/50 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="grid h-8.5 w-8.5 place-items-center rounded-xl bg-card border border-border/40">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{title}</p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
