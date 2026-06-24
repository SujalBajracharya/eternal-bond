/**
 * InterestsPicker
 * ───────────────
 * A production-quality interest selection experience built for EternalBond.
 * Designed to power match recommendations, compatibility scoring, and search.
 *
 * Key behaviour:
 *  - Interests are always stored and compared in their normalised form (lowercase, trimmed).
 *  - A display label is preserved for rendering (e.g. "Ed Sheeran" stores as "ed sheeran").
 *  - Common synonym clusters collapse to a single canonical interest.
 *  - Selections are saved in realtime to the `profile_interests` Supabase table.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Plus, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface Interest {
  id?: string;          // DB uuid (absent before first save)
  displayName: string;  // Shown to the user  ("Ed Sheeran")
  normalized: string;   // Stored + matched    ("ed sheeran")
}

/* ─── Synonym / normalization map ───────────────────────────────────────── */

/** Maps free-form expressions → canonical normalized key */
const SYNONYM_MAP: Record<string, string> = {
  // Music variations
  "listening to music": "music",
  "love music": "music",
  "hearing songs": "music",
  "songs": "music",
  "playing music": "music",
  // Sports variations
  "football": "football",
  "foot ball": "football",
  "soccer": "football",
  // Travel variations
  "travelling": "travel",
  "traveling": "travel",
  "trips": "travel",
  "road trips": "travel",
  // Reading variations
  "reading books": "reading",
  "love reading": "reading",
  "book reading": "reading",
  // Cooking variations
  "cooking food": "cooking",
  "love cooking": "cooking",
  // Fitness
  "gym": "fitness",
  "working out": "fitness",
  "exercise": "fitness",
  "workout": "fitness",
};

/** Normalise any user-entered string to a canonical key */
export function normalizeInterest(raw: string): string {
  const trimmed = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return SYNONYM_MAP[trimmed] ?? trimmed;
}

/* ─── Category catalogue ─────────────────────────────────────────────────── */

interface Category {
  emoji: string;
  label: string;
  interests: { displayName: string; normalized: string }[];
}

export const CATEGORIES: Category[] = [
  {
    emoji: "🏏",
    label: "Sports",
    interests: [
      { displayName: "Cricket", normalized: "cricket" },
      { displayName: "Football", normalized: "football" },
      { displayName: "Basketball", normalized: "basketball" },
      { displayName: "Tennis", normalized: "tennis" },
      { displayName: "Badminton", normalized: "badminton" },
      { displayName: "Hiking", normalized: "hiking" },
      { displayName: "Swimming", normalized: "swimming" },
      { displayName: "Cycling", normalized: "cycling" },
      { displayName: "Chess", normalized: "chess" },
    ],
  },
  {
    emoji: "🎵",
    label: "Music",
    interests: [
      { displayName: "Music", normalized: "music" },
      { displayName: "Singing", normalized: "singing" },
      { displayName: "Guitar", normalized: "guitar" },
      { displayName: "Piano", normalized: "piano" },
      { displayName: "Classical Music", normalized: "classical music" },
      { displayName: "Bollywood Music", normalized: "bollywood music" },
      { displayName: "Ed Sheeran", normalized: "ed sheeran" },
      { displayName: "Taylor Swift", normalized: "taylor swift" },
      { displayName: "Arijit Singh", normalized: "arijit singh" },
    ],
  },
  {
    emoji: "✈️",
    label: "Travel",
    interests: [
      { displayName: "Travel", normalized: "travel" },
      { displayName: "Road Trips", normalized: "road trips" },
      { displayName: "Backpacking", normalized: "backpacking" },
      { displayName: "Mountains", normalized: "mountains" },
      { displayName: "Beach Vacations", normalized: "beach vacations" },
      { displayName: "Solo Travel", normalized: "solo travel" },
      { displayName: "Adventure Travel", normalized: "adventure travel" },
    ],
  },
  {
    emoji: "🍜",
    label: "Food",
    interests: [
      { displayName: "Cooking", normalized: "cooking" },
      { displayName: "Baking", normalized: "baking" },
      { displayName: "Food Photography", normalized: "food photography" },
      { displayName: "Street Food", normalized: "street food" },
      { displayName: "Vegetarian Cooking", normalized: "vegetarian cooking" },
      { displayName: "Coffee", normalized: "coffee" },
      { displayName: "Tea", normalized: "tea" },
    ],
  },
  {
    emoji: "🎬",
    label: "Movies & TV",
    interests: [
      { displayName: "Cinema", normalized: "cinema" },
      { displayName: "Bollywood", normalized: "bollywood" },
      { displayName: "Hollywood", normalized: "hollywood" },
      { displayName: "Documentaries", normalized: "documentaries" },
      { displayName: "Anime", normalized: "anime" },
      { displayName: "Web Series", normalized: "web series" },
      { displayName: "Theatre", normalized: "theatre" },
    ],
  },
  {
    emoji: "📚",
    label: "Books",
    interests: [
      { displayName: "Reading", normalized: "reading" },
      { displayName: "Fiction", normalized: "fiction" },
      { displayName: "Spirituality Books", normalized: "spirituality books" },
      { displayName: "Self-Help", normalized: "self-help" },
      { displayName: "History", normalized: "history" },
      { displayName: "Poetry", normalized: "poetry" },
    ],
  },
  {
    emoji: "💪",
    label: "Fitness",
    interests: [
      { displayName: "Fitness", normalized: "fitness" },
      { displayName: "Yoga", normalized: "yoga" },
      { displayName: "Meditation", normalized: "meditation" },
      { displayName: "Running", normalized: "running" },
      { displayName: "Martial Arts", normalized: "martial arts" },
      { displayName: "Dance", normalized: "dance" },
    ],
  },
  {
    emoji: "💻",
    label: "Technology",
    interests: [
      { displayName: "Technology", normalized: "technology" },
      { displayName: "Coding", normalized: "coding" },
      { displayName: "AI & Machine Learning", normalized: "ai & machine learning" },
      { displayName: "Gaming", normalized: "gaming" },
      { displayName: "Photography", normalized: "photography" },
      { displayName: "Videography", normalized: "videography" },
    ],
  },
  {
    emoji: "🙏",
    label: "Spirituality",
    interests: [
      { displayName: "Spirituality", normalized: "spirituality" },
      { displayName: "Astrology", normalized: "astrology" },
      { displayName: "Volunteering", normalized: "volunteering" },
      { displayName: "Mindfulness", normalized: "mindfulness" },
      { displayName: "Prayer", normalized: "prayer" },
    ],
  },
  {
    emoji: "🎨",
    label: "Arts",
    interests: [
      { displayName: "Painting", normalized: "painting" },
      { displayName: "Drawing", normalized: "drawing" },
      { displayName: "Sculpting", normalized: "sculpting" },
      { displayName: "Pottery", normalized: "pottery" },
      { displayName: "Calligraphy", normalized: "calligraphy" },
      { displayName: "Interior Design", normalized: "interior design" },
    ],
  },
  {
    emoji: "🌿",
    label: "Nature",
    interests: [
      { displayName: "Gardening", normalized: "gardening" },
      { displayName: "Bird Watching", normalized: "bird watching" },
      { displayName: "Camping", normalized: "camping" },
      { displayName: "Trekking", normalized: "trekking" },
      { displayName: "Pets", normalized: "pets" },
      { displayName: "Sustainability", normalized: "sustainability" },
    ],
  },
  {
    emoji: "🚀",
    label: "Entrepreneurship",
    interests: [
      { displayName: "Entrepreneurship", normalized: "entrepreneurship" },
      { displayName: "Investing", normalized: "investing" },
      { displayName: "Startups", normalized: "startups" },
      { displayName: "Leadership", normalized: "leadership" },
      { displayName: "Public Speaking", normalized: "public speaking" },
    ],
  },
];

/* ─── Smart suggestions ──────────────────────────────────────────────────── */

const SMART_SUGGESTIONS: Record<string, string[]> = {
  football: ["cricket", "sports", "badminton", "premier league", "world cup"],
  cricket: ["football", "badminton", "sports"],
  travel: ["road trips", "mountains", "beach vacations", "backpacking", "hiking"],
  music: ["singing", "guitar", "bollywood music", "classical music"],
  cooking: ["baking", "food photography", "vegetarian cooking", "street food"],
  reading: ["fiction", "self-help", "poetry"],
  fitness: ["yoga", "meditation", "running", "dance"],
  technology: ["coding", "gaming", "ai & machine learning"],
  cinema: ["bollywood", "hollywood", "documentaries", "web series"],
};

function getSmartSuggestions(selected: Interest[]): string[] {
  const seen = new Set<string>(selected.map((i) => i.normalized));
  const suggestions = new Set<string>();

  selected.forEach((interest) => {
    const related = SMART_SUGGESTIONS[interest.normalized] ?? [];
    related.forEach((r) => {
      if (!seen.has(r)) suggestions.add(r);
    });
  });

  return [...suggestions].slice(0, 6);
}

/* ─── Flat catalogue for search ─────────────────────────────────────────── */

const ALL_INTERESTS: { displayName: string; normalized: string }[] = CATEGORIES.flatMap(
  (c) => c.interests
);

/* ─── Component ──────────────────────────────────────────────────────────── */

interface InterestsPickerProps {
  profileId: string;
}

const MIN_RECOMMENDED = 5;
const MAX_ALLOWED = 20;

export default function InterestsPicker({ profileId }: InterestsPickerProps) {
  const [selected, setSelected] = useState<Interest[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null); // normalized currently saving
  const [query, setQuery] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Load interests from DB */
  useEffect(() => {
    (async () => {
      setLoadingDb(true);
      const { data, error } = await supabase
        .from("profile_interests" as any)
        .select("id, interest")
        .eq("profile_id", profileId);

      if (error) {
        toast.error("Could not load interests");
      } else {
        const loaded: Interest[] = (data ?? []).map((row: any) => ({
          id: row.id,
          normalized: row.interest,
          displayName: ALL_INTERESTS.find((i) => i.normalized === row.interest)?.displayName ?? toDisplayName(row.interest),
        }));
        setSelected(loaded);
      }
      setLoadingDb(false);
    })();
  }, [profileId]);

  const toDisplayName = (normalized: string) =>
    normalized
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  /* Add interest */
  const addInterest = useCallback(
    async (candidate: { displayName: string; normalized: string }) => {
      const norm = candidate.normalized;

      // Duplicate guard
      if (selected.some((s) => s.normalized === norm)) {
        toast.info(`"${candidate.displayName}" is already in your interests`);
        return;
      }
      if (selected.length >= MAX_ALLOWED) {
        toast.warning(`You can add up to ${MAX_ALLOWED} interests`);
        return;
      }

      setSavingId(norm);
      const { data, error } = await supabase
        .from("profile_interests" as any)
        .insert({ profile_id: profileId, interest: norm })
        .select("id")
        .single();

      console.log("=== INTEREST INSERT DEBUG ===");
      console.log("profileId:", profileId);
      console.log("interest:", norm);
      console.log("user:", await supabase.auth.getUser());
      console.log("data:", data);
      console.log("error:", error);
      setSavingId(null);

      if (error) {
        toast.error("Couldn't save interest");
        return;
      }

      setSelected((prev) => [
        ...prev,
        { id: (data as any).id, displayName: candidate.displayName, normalized: norm },
      ]);
      setQuery("");
    },
    [selected, profileId]
  );

  /* Remove interest */
  const removeInterest = useCallback(
    async (interest: Interest) => {
      if (!interest.id) return;
      setSavingId(interest.normalized);
      const { error } = await supabase
        .from("profile_interests" as any)
        .delete()
        .eq("id", interest.id);
      setSavingId(null);

      if (error) {
        toast.error("Couldn't remove interest");
        return;
      }
      setSelected((prev) => prev.filter((s) => s.id !== interest.id));
    },
    []
  );

  /* Add custom free-text interest */
  const addCustom = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const norm = normalizeInterest(trimmed);
    const existing = ALL_INTERESTS.find((i) => i.normalized === norm);
    addInterest(existing ?? { displayName: trimmed, normalized: norm });
  };

  /* Filtered search results */
  const searchResults = query.trim()
    ? ALL_INTERESTS.filter(
      (i) =>
        i.normalized.includes(query.toLowerCase()) &&
        !selected.some((s) => s.normalized === i.normalized)
    ).slice(0, 8)
    : [];

  const smartSuggestions = getSmartSuggestions(selected);
  const progress = Math.min((selected.length / MIN_RECOMMENDED) * 100, 100);

  if (loadingDb) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Progress indicator */}
      <div>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2 font-semibold">
          <span>Your interests</span>
          <span className="tabular-nums text-primary font-bold">{selected.length} / {MAX_ALLOWED}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              progress >= 100 ? "bg-primary" : "bg-gradient-to-r from-primary/60 to-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        {selected.length < MIN_RECOMMENDED && (
          <p className="text-[11.5px] text-muted-foreground mt-1.5">
            Add at least {MIN_RECOMMENDED} interests for better matches — you have {MIN_RECOMMENDED - selected.length} to go.
          </p>
        )}
        {selected.length >= MIN_RECOMMENDED && (
          <p className="text-[11.5px] text-primary mt-1.5 font-medium">
            ✨ Great — your matches will now be more accurate!
          </p>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((interest) => (
            <button
              key={interest.normalized}
              onClick={() => removeInterest(interest)}
              disabled={savingId === interest.normalized}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/80 active:scale-95 transition-all duration-200",
                "ring-2 ring-primary/20 shadow-sm",
                "disabled:opacity-60 disabled:cursor-wait"
              )}
              aria-label={`Remove ${interest.displayName}`}
            >
              {savingId === interest.normalized ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3 opacity-70" />
              )}
              {interest.displayName}
            </button>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <div className="text-center py-8 rounded-2xl border-2 border-dashed border-border/60">
          <div className="text-3xl mb-2">💫</div>
          <p className="text-[13.5px] font-medium text-foreground">No interests yet</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Search below or pick from categories — we use these to find your best matches.
          </p>
        </div>
      )}

      {/* Search box */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addCustom(); }
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search interests or type a custom one…"
            className={cn(
              "w-full pl-10 pr-12 py-2.5 rounded-xl text-[14px] border border-border",
              "bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
              "placeholder:text-muted-foreground transition-all"
            )}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-20 top-full mt-1.5 left-0 right-0 rounded-xl border border-border bg-popover shadow-lg overflow-hidden animate-fade-in">
            {searchResults.map((i) => (
              <button
                key={i.normalized}
                onClick={() => { addInterest(i); inputRef.current?.focus(); }}
                disabled={savingId === i.normalized}
                className="w-full flex items-center justify-between px-4 py-2.5 text-[13.5px] hover:bg-muted/60 transition-colors text-left"
              >
                <span>{i.displayName}</span>
                {savingId === i.normalized ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-primary" />
                )}
              </button>
            ))}
            {/* Custom add if no exact match */}
            {query.trim() && !ALL_INTERESTS.some((i) => i.normalized === normalizeInterest(query)) && (
              <button
                onClick={addCustom}
                className="w-full flex items-center justify-between px-4 py-2.5 text-[13.5px] hover:bg-primary/5 text-primary font-medium border-t border-border transition-colors"
              >
                <span>Add "{query.trim()}"</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Smart suggestions */}
      {smartSuggestions.length > 0 && !query && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Suggested for you
          </div>
          <div className="flex flex-wrap gap-2">
            {smartSuggestions.map((norm) => {
              const item = ALL_INTERESTS.find((i) => i.normalized === norm) ?? {
                displayName: norm.replace(/\b\w/g, (c) => c.toUpperCase()),
                normalized: norm,
              };
              return (
                <button
                  key={norm}
                  onClick={() => addInterest(item)}
                  disabled={savingId === norm}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium",
                    "bg-accent/10 text-accent-foreground border border-accent/30",
                    "hover:bg-accent/20 hover:border-accent/60 transition-all duration-200 active:scale-95"
                  )}
                >
                  {savingId === norm ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  {item.displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category browser */}
      {!query && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
            Browse by category
          </div>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const isOpen = expandedCat === cat.label;
              const unselectedItems = cat.interests.filter(
                (i) => !selected.some((s) => s.normalized === i.normalized)
              );
              return (
                <div
                  key={cat.label}
                  className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCat(isOpen ? null : cat.label)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <span className="flex items-center gap-2.5 text-[13.5px] font-medium text-foreground">
                      <span className="text-lg leading-none">{cat.emoji}</span>
                      {cat.label}
                      <span className="text-[11px] text-muted-foreground font-normal tabular-nums">
                        {cat.interests.length - unselectedItems.length} selected
                      </span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2 animate-fade-in border-t border-border/50">
                      {cat.interests.map((item) => {
                        const isSelected = selected.some((s) => s.normalized === item.normalized);
                        const isSaving = savingId === item.normalized;
                        return (
                          <button
                            key={item.normalized}
                            onClick={() =>
                              isSelected
                                ? removeInterest(selected.find((s) => s.normalized === item.normalized)!)
                                : addInterest(item)
                            }
                            disabled={isSaving}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-all duration-200 active:scale-95",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                                : "bg-muted/50 text-foreground/80 border border-border hover:bg-muted hover:border-primary/30",
                              isSaving && "opacity-60 cursor-wait"
                            )}
                          >
                            {isSaving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isSelected ? (
                              <X className="w-3 h-3 opacity-70" />
                            ) : (
                              <Plus className="w-3 h-3 opacity-60" />
                            )}
                            {item.displayName}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
