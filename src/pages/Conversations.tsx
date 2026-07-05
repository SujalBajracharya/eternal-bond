import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Heart,
  Hourglass,
  Gamepad2,
  Users,
  ShieldCheck,
  ChevronRight,
  Search,
  Sunrise,
  Plus,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import match1 from "@/assets/match-1.jpg";
import match2 from "@/assets/match-2.jpg";
import match3 from "@/assets/match-3.jpg";
import match4 from "@/assets/match-4.jpg";
import match5 from "@/assets/match-5.jpg";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type Conversation = {
  id: string;
  name: string;
  age: number;
  photo: string;
  mood: string;
  lastMessage: string;
  lastAt: string;
  unread?: number;
  familyAssisted?: boolean;
  verified?: boolean;
  newMatch?: boolean;
  gameNight?: boolean;
  // hours remaining (for expiring)
  expiresInHours?: number;
};

const GAME_NIGHT: Conversation[] = [
  {
    id: "g1",
    name: "Tara",
    age: 28,
    photo: match2,
    mood: "Met at Thursday Trivia 🎲",
    lastMessage: "Rematch this week? I'm bringing better answers.",
    lastAt: "3h",
    gameNight: true,
    unread: 1,
  },
  {
    id: "g2",
    name: "Aditi",
    age: 26,
    photo: match3,
    mood: "Pictionary partner",
    lastMessage: "Your drawing of an elephant was… abstract.",
    lastAt: "2d",
    gameNight: true,
  },
];

const calculateAge = (dobString: string | null | undefined) => {
  if (!dobString) return 28;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 28;
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

function formatTime(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return "Just now";
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins || 1}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d`;
}

function Avatar({
  src,
  alt,
  size = 56,
  ring,
}: {
  src: string;
  alt: string;
  size?: number;
  ring?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-background",
        ring ?? "ring-border/60",
      )}
      style={{ width: size, height: size }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
  tone = "default",
}: {
  icon: any;
  title: string;
  subtitle: string;
  count: number;
  tone?: "default" | "rose" | "gold" | "plum" | "sage";
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-muted text-foreground",
    rose: "bg-primary/10 text-primary",
    gold: "bg-accent/15 text-accent-foreground",
    plum: "bg-plum/10 text-plum",
    sage: "bg-sage/15 text-foreground",
  };
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-2xl grid place-items-center",
            toneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-serif text-2xl md:text-[28px] leading-none text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        </div>
      </div>
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {count} {count === 1 ? "thread" : "threads"}
      </span>
    </div>
  );
}

function ActiveRow({ c }: { c: Conversation }) {
  return (
    <Link
      to={`/chat/${c.id}`}
      className={cn(
        "group w-full text-left flex items-start gap-4 p-4 md:p-5 rounded-2xl",
        "bg-card/80 backdrop-blur border border-border/60 shadow-sm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card hover:border-primary/30",
      )}
    >
      <div className="relative">
        <Avatar
          src={c.photo}
          alt={c.name}
          size={64}
          ring={c.unread ? "ring-primary/50" : "ring-border/60"}
        />
        {c.unread ? (
          <span className="absolute -bottom-0.5 -right-0.5 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold grid place-items-center shadow-soft">
            {c.unread}
          </span>
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="font-serif text-lg leading-none text-foreground">
            {c.name}{" "}
            <span className="text-muted-foreground font-sans text-sm">
              · {c.age}
            </span>
          </h3>
          {c.verified && (
            <span className="inline-flex items-center gap-1 text-[11px] text-sage">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
          {c.familyAssisted && (
            <Badge
              variant="outline"
              className="text-[10px] border-plum/30 text-plum bg-plum/5 rounded-full px-2 py-0"
            >
              Family-assisted
            </Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {c.lastAt}
          </span>
        </div>
        <p className="text-xs text-muted-foreground italic mt-1">{c.mood}</p>
        <p
          className={cn(
            "text-sm mt-2 line-clamp-1",
            c.unread ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {c.lastMessage}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground/50 self-center transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  );
}

function NewMatchCard({ c }: { c: Conversation }) {
  return (
    <Link
      to={`/chat/${c.id}`}
      className="group relative w-[200px] shrink-0 rounded-3xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-glow transition-all duration-500 hover:-translate-y-1 block"
    >
      <div className="relative h-[260px]">
        <img
          src={c.photo}
          alt={c.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary/90 text-primary-foreground border-0 rounded-full text-[10px] px-2 py-0.5 shadow-soft">
            <Sparkles className="h-3 w-3 mr-1" /> New match
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="font-serif text-lg leading-none">
            {c.name} <span className="opacity-80 text-sm">· {c.age}</span>
          </p>
          <p className="text-[11px] opacity-85 mt-1 line-clamp-1">{c.mood}</p>
        </div>
      </div>
      <div className="p-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {c.familyAssisted ? "Family-assisted" : "Just matched"}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
          Say hello <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function GameNightRow({ c }: { c: Conversation }) {
  return (
    <button className="group w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-plum/10 via-card to-card border border-plum/15 hover:border-plum/30 transition-all duration-300 hover:shadow-card">
      <Avatar src={c.photo} alt={c.name} size={56} ring="ring-plum/30" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="font-serif text-base leading-none">
            {c.name}{" "}
            <span className="text-muted-foreground font-sans text-xs">
              · {c.age}
            </span>
          </h3>
          <Badge className="bg-plum/15 text-plum border-0 text-[10px] rounded-full px-2 py-0">
            <Gamepad2 className="h-3 w-3 mr-1" /> Game Night
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground">
            {c.lastAt}
          </span>
        </div>
        <p className="text-xs text-muted-foreground italic mt-1">{c.mood}</p>
        <p className="text-sm text-foreground/90 mt-2 line-clamp-1">
          {c.lastMessage}
        </p>
      </div>
      {c.unread ? (
        <span className="h-2.5 w-2.5 rounded-full bg-plum shrink-0" />
      ) : null}
    </button>
  );
}

function ExpiringCard({ c }: { c: Conversation }) {
  const total = 168; // 7 days in hours
  const remaining = c.expiresInHours ?? 0;
  const pct = Math.max(2, Math.min(100, (remaining / total) * 100));
  const urgent = remaining <= 24;
  return (
    <Link
      to={`/chat/${c.id}`}
      className="group relative rounded-3xl p-5 md:p-6 overflow-hidden border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card shadow-sm hover:shadow-card transition-all duration-500 block"
    >
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="flex items-start gap-4 relative">
        <Avatar src={c.photo} alt={c.name} size={64} ring="ring-accent/40" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-serif text-lg leading-none">
              {c.name}{" "}
              <span className="text-muted-foreground font-sans text-sm">
                · {c.age}
              </span>
            </h3>
            {c.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] text-sage">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-foreground/70">
              <Hourglass
                className={cn(
                  "h-3.5 w-3.5",
                  urgent ? "text-primary" : "text-accent-foreground/70",
                )}
              />
              Expires in {remaining}h
            </span>
          </div>
          <p className="text-xs text-muted-foreground italic mt-1">{c.mood}</p>
          <p className="text-sm text-foreground/90 mt-2 line-clamp-1">
            {c.lastMessage}
          </p>

          <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-muted/70 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  urgent
                    ? "bg-gradient-sunset"
                    : "bg-gradient-to-r from-accent to-primary/60",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">
                A short window — but no rush
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-xs rounded-full text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.preventDefault(); // prevent navigation on button click
                  // Extending logic could go here
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Extend by 24h
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Conversations() {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState<Conversation[]>([]);
  const [freshList, setFreshList] = useState<Conversation[]>([]);
  const [expiringList, setExpiringList] = useState<Conversation[]>([]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    async function load() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      try {
        const userId = session.user.id;

        // Fetch matches where user is part of the match, exclude game night
        const { data: matches, error: matchError } = await supabase
          .from("matches")
          .select("*")
          .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
          .is("is_game_night", null); // Or false depending on schema, NULL is safe fallback

        if (matchError) throw matchError;

        if (!matches || matches.length === 0) {
          setLoading(false);
          return;
        }

        const matchIds = matches.map((m: any) => m.id);
        const partnerIds = matches.map((m: any) =>
          m.user_one_id === userId ? m.user_two_id : m.user_one_id,
        );

        // Fetch partner profiles
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, avatar_url, date_of_birth, profession, location, kyc_status, family_type",
          )
          .in("id", partnerIds);

        if (profileError) throw profileError;

        // Fetch messages for these matches
        const { data: messages, error: msgError } = await supabase
          .from("messages")
          .select("*")
          .in("match_id", matchIds)
          .order("created_at", { ascending: false });

        if (msgError) throw msgError;

        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));
        const latestMsgMap = new Map();
        const unreadCountMap = new Map();

        if (messages) {
          for (const msg of messages) {
            // First message per match is the latest due to descending order
            if (!latestMsgMap.has(msg.match_id)) {
              latestMsgMap.set(msg.match_id, msg);
            }
            // Count unread messages not sent by current user
            if (!msg.is_read && msg.sender_id !== userId) {
              unreadCountMap.set(
                msg.match_id,
                (unreadCountMap.get(msg.match_id) || 0) + 1,
              );
            }
          }
        }

        const newActive: Conversation[] = [];
        const newFresh: Conversation[] = [];
        const newExpiring: Conversation[] = [];

        for (const match of matches) {
          const isGameNight = match.is_game_night === true;
          if (isGameNight) continue;

          const partnerId =
            match.user_one_id === userId
              ? match.user_two_id
              : match.user_one_id;
          const partner = profileMap.get(partnerId);
          if (!partner) continue;

          const latestMsg = latestMsgMap.get(match.id);
          const unreadCount = unreadCountMap.get(match.id) || 0;

          let expiresInHours = undefined;
          if (match.expires_at) {
            const expDate = new Date(match.expires_at);
            const now = new Date();
            const diffMs = expDate.getTime() - now.getTime();
            if (diffMs > 0) {
              expiresInHours = Math.ceil(diffMs / (1000 * 60 * 60));
            } else {
              expiresInHours = 0; // Expired
            }
          }

          // Consider expiring if it has an expiration date, is within 72 hours, and is an active conversation
          const isExpiring =
            latestMsg &&
            expiresInHours !== undefined &&
            expiresInHours > 0 &&
            expiresInHours <= 72;
          const isFamilyAssisted =
            partner.family_type === "joint" || partner.family_type === "other";

          const conv: Conversation = {
            id: match.id,
            name: partner.full_name || "Anonymous",
            age: calculateAge(partner.date_of_birth),
            photo: partner.avatar_url || match1,
            mood: partner.profession
              ? `${partner.profession} • ${partner.location || "India"}`
              : "Looking for a lifetime connection",
            lastMessage: latestMsg ? latestMsg.content : "",
            lastAt: latestMsg ? formatTime(latestMsg.created_at) : "",
            unread: unreadCount > 0 ? unreadCount : undefined,
            verified: partner.kyc_status === "verified",
            familyAssisted: isFamilyAssisted,
            expiresInHours,
          };

          if (!latestMsg) {
            conv.newMatch = true;
            newFresh.push(conv);
          } else {
            if (isExpiring) {
              newExpiring.push(conv);
            } else {
              newActive.push(conv);
            }
          }
        }

        setActiveList(newActive);
        setFreshList(newFresh);
        setExpiringList(newExpiring);
      } catch (err) {
        console.error("Error loading conversations:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [session]);

  const filter = (list: Conversation[]) =>
    query.trim()
      ? list.filter((c) =>
          (c.name + " " + c.mood + " " + c.lastMessage)
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
      : list;

  const active = filter(activeList);
  const fresh = filter(freshList);
  const game = filter(GAME_NIGHT);
  const expiring = filter(expiringList);

  return (
    <div className="min-h-screen bg-gradient-blush">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-sunset grid place-items-center shadow-soft">
              <Heart className="h-4 w-4 text-white" fill="currentColor" />
            </div>
            <span className="font-serif text-lg">Conversations</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/today">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
              >
                <Sunrise className="h-3.5 w-3.5 mr-1.5" /> Today's matches
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 pt-10 md:pt-14 pb-24">
        {/* Hero */}
        <section className="mb-10 md:mb-14 animate-fade-in">
          <p className="text-xs uppercase tracking-[0.22em] text-primary/80">
            {greeting}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight mt-3 text-foreground">
            A few meaningful{" "}
            <span className="text-gradient-sunset">conversations</span>,
            <br className="hidden md:block" /> not endless chats.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl">
            Each thread here is intentional. Take your time, reply with care,
            and let things unfold at a pace that feels right.
          </p>

          <div className="mt-6 max-w-md relative">
            <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or a phrase…"
              className="pl-10 h-11 rounded-full bg-card/80 backdrop-blur border-border/60"
            />
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active */}
            <section
              className="mb-14 animate-fade-in"
              style={{ animationDelay: "60ms" }}
            >
              <SectionHeader
                icon={MessageCircle}
                title="Active conversations"
                subtitle="Threads where you're already talking."
                count={active.length}
                tone="rose"
              />
              <div className="space-y-3">
                {active.map((c) => (
                  <ActiveRow key={c.id} c={c} />
                ))}
                {active.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No active conversations match your search.
                  </p>
                )}
              </div>
            </section>

            {/* New matches — horizontal cards */}
            {freshList.length > 0 && (
              <section
                className="mb-14 animate-fade-in"
                style={{ animationDelay: "120ms" }}
              >
                <SectionHeader
                  icon={Sparkles}
                  title="New matches"
                  subtitle="Mutual interest — say the first hello when you're ready."
                  count={fresh.length}
                  tone="gold"
                />
                <div className="-mx-2 px-2 overflow-x-auto">
                  <div className="flex gap-4 pb-2">
                    {fresh.map((c) => (
                      <NewMatchCard key={c.id} c={c} />
                    ))}
                    {fresh.length === 0 && (
                      <p className="text-sm text-muted-foreground py-8 w-full text-center">
                        No new matches align with your search.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Game night */}
            <section
              className="mb-14 animate-fade-in"
              style={{ animationDelay: "180ms" }}
            >
              <SectionHeader
                icon={Gamepad2}
                title="Game Night matches"
                subtitle="People you connected with through curated game evenings."
                count={game.length}
                tone="plum"
              />
              <div className="grid md:grid-cols-2 gap-3">
                {game.map((c) => (
                  <GameNightRow key={c.id} c={c} />
                ))}
                {game.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 col-span-2 text-center">
                    No game night connections match your search.
                  </p>
                )}
              </div>
            </section>

            {/* Expiring */}
            {expiringList.length > 0 && (
              <section
                className="mb-10 animate-fade-in"
                style={{ animationDelay: "240ms" }}
              >
                <SectionHeader
                  icon={Hourglass}
                  title="Expiring connections"
                  subtitle="A gentle nudge — these threads close soon if no one writes back."
                  count={expiring.length}
                  tone="sage"
                />
                <div className="grid md:grid-cols-2 gap-4">
                  {expiring.map((c) => (
                    <ExpiringCard key={c.id} c={c} />
                  ))}
                  {expiring.length === 0 && (
                    <p className="text-sm text-muted-foreground py-8 col-span-2 text-center">
                      No expiring connections match your search.
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* Footer note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/70 border border-border/50 backdrop-blur text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-sage" />
            Conversations here are private, verified, and family-aware.
          </div>
        </div>
      </main>
    </div>
  );
}
