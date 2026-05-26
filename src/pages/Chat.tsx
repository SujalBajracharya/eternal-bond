import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Hourglass,
  MoreHorizontal,
  Smile,
  Paperclip,
  Send,
  Palette,
  Check,
  CheckCheck,
  Sparkles,
  Search,
  X,
  Image as ImageIcon,
  FileText,
  Camera,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import match1 from "@/assets/match-1.jpg";
import match2 from "@/assets/match-2.jpg";
import match3 from "@/assets/match-3.jpg";

type MsgStatus = "sent" | "delivered" | "read";

type Attachment = {
  kind: "image" | "file";
  url?: string;
  name: string;
  size?: string;
};

type Msg = {
  id: string;
  text?: string;
  fromMe: boolean;
  at: string;
  status?: MsgStatus;
  attachment?: Attachment;
};

const PARTNER = {
  name: "Ananya",
  age: 27,
  city: "Kathmandu",
  photo: match1,
  status: "Family-assisted • Verified",
  verified: true,
  expiresInHours: 36,
  bio: "Reading Murakami this week",
  gallery: [match1, match2, match3],
};

const SEED: Msg[] = [
  { id: "1", text: "Hi Ananya — your note about long walks made me smile.", fromMe: true, at: "9:14 AM", status: "read" },
  { id: "2", text: "Thank you 🌿 Walks are how I think most clearly.", fromMe: false, at: "9:18 AM" },
  { id: "3", text: "Same. There's a quiet park near Cubbon I love at sunrise.", fromMe: true, at: "9:20 AM", status: "read" },
  { id: "4", text: "Haha, that café sounds lovely — let's plan it for Sunday?", fromMe: false, at: "9:22 AM" },
  {
    id: "5",
    fromMe: false,
    at: "9:24 AM",
    attachment: { kind: "image", url: match2, name: "cafe.jpg" },
    text: "This is the place I was telling you about ☕",
  },
  {
    id: "6",
    fromMe: true,
    at: "9:26 AM",
    status: "delivered",
    attachment: { kind: "file", name: "Sunday-plan.pdf", size: "182 KB" },
    text: "Drafted a tiny itinerary 🌼",
  },
];

const THEMES = [
  {
    id: "blush",
    label: "Blush",
    bg: "bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(var(--secondary)/0.4)] to-[hsl(var(--background))]",
    me: "bg-gradient-sunset text-white",
    them: "bg-card border border-border/60 text-foreground",
  },
  {
    id: "sage",
    label: "Sage",
    bg: "bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(var(--sage)/0.18)] to-[hsl(var(--background))]",
    me: "bg-sage text-foreground",
    them: "bg-card border border-border/60 text-foreground",
  },
  {
    id: "sand",
    label: "Sand",
    bg: "bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(var(--accent)/0.18)] to-[hsl(var(--background))]",
    me: "bg-accent text-accent-foreground",
    them: "bg-card border border-border/60 text-foreground",
  },
  {
    id: "ivory",
    label: "Ivory",
    bg: "bg-[hsl(var(--background))]",
    me: "bg-foreground text-background",
    them: "bg-muted text-foreground",
  },
] as const;

type Theme = (typeof THEMES)[number];

function ExpiringPill({ hours }: { hours: number }) {
  const urgent = hours <= 24;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border",
        urgent
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-accent/15 text-foreground/70 border-accent/30",
      )}
    >
      <Hourglass className="h-3 w-3" />
      Closes in {hours}h
    </span>
  );
}

function StatusTicks({ status }: { status?: MsgStatus }) {
  if (!status) return null;
  if (status === "sent") return <Check className="h-3 w-3 opacity-70" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 opacity-70" />;
  // read
  return <CheckCheck className="h-3 w-3 text-sky-300" />;
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-300/70 text-foreground rounded px-0.5">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function AttachmentView({ a, mine }: { a: Attachment; mine: boolean }) {
  if (a.kind === "image" && a.url) {
    return (
      <a href={a.url} target="_blank" rel="noreferrer" className="block -mx-1 -mt-1 mb-1.5 overflow-hidden rounded-xl">
        <img src={a.url} alt={a.name} className="max-h-64 w-full object-cover" />
      </a>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 mb-1.5",
        mine ? "bg-white/15" : "bg-muted/60",
      )}
    >
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", mine ? "bg-white/20" : "bg-background")}>
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium truncate">{a.name}</p>
        {a.size && <p className="text-[10.5px] opacity-70">{a.size}</p>}
      </div>
    </div>
  );
}

function Bubble({
  m,
  theme,
  query,
  isHit,
  isActive,
  innerRef,
}: {
  m: Msg;
  theme: Theme;
  query: string;
  isHit: boolean;
  isActive: boolean;
  innerRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={innerRef} className={cn("flex w-full", m.fromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] md:max-w-[60%] px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed shadow-sm",
          "animate-fade-in transition-all",
          m.fromMe ? cn(theme.me, "rounded-br-md") : cn(theme.them, "rounded-bl-md"),
          isActive && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
          isHit && !isActive && "ring-1 ring-primary/30",
        )}
      >
        {m.attachment && <AttachmentView a={m.attachment} mine={m.fromMe} />}
        {m.text && (
          <p className="whitespace-pre-wrap">
            {query ? highlight(m.text, query) : m.text}
          </p>
        )}
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10.5px] opacity-70",
            m.fromMe ? "justify-end" : "justify-start",
          )}
        >
          <span>{m.at}</span>
          {m.fromMe && <StatusTicks status={m.status} />}
        </div>
      </div>
    </div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="h-px flex-1 bg-border/60" />
      <span className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

export default function Chat() {
  useParams();
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [draft, setDraft] = useState("");
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [typing, setTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeHit, setActiveHit] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as string[];
    return messages.filter((m) => m.text?.toLowerCase().includes(q)).map((m) => m.id);
  }, [query, messages]);

  useEffect(() => {
    if (!searchOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, typing, searchOpen]);

  useEffect(() => {
    setActiveHit(0);
  }, [query]);

  useEffect(() => {
    if (!hits.length) return;
    const id = hits[activeHit];
    bubbleRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeHit, hits]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const at = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const id = crypto.randomUUID();
    setMessages((m) => [...m, { id, text, fromMe: true, at, status: "sent" }]);
    setDraft("");
    // simulate delivery → read
    setTimeout(() => {
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, status: "delivered" } : x)));
    }, 600);
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, status: "read" } : x)));
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          text: "That sounds wonderful — let me check with my parents and get back 🌸",
          fromMe: false,
          at: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        },
      ]);
    }, 1800);
  };

  const handleFiles = (files: FileList | null, kind: "image" | "file") => {
    if (!files || !files.length) return;
    const at = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const newMsgs: Msg[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      fromMe: true,
      at,
      status: "sent",
      attachment: {
        kind,
        name: f.name,
        size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
        url: kind === "image" ? URL.createObjectURL(f) : undefined,
      },
    }));
    setMessages((m) => [...m, ...newMsgs]);
    newMsgs.forEach((nm) => {
      setTimeout(() => {
        setMessages((m) => m.map((x) => (x.id === nm.id ? { ...x, status: "delivered" } : x)));
      }, 700);
      setTimeout(() => {
        setMessages((m) => m.map((x) => (x.id === nm.id ? { ...x, status: "read" } : x)));
      }, 1800);
    });
  };

  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-500", theme.bg)}>
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="max-w-3xl mx-auto px-3 md:px-6 py-3 flex items-center gap-3">
          <Link to="/matches">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="relative shrink-0">
            <div className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <img src={PARTNER.photo} alt={PARTNER.name} className="h-full w-full object-cover" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-sage ring-2 ring-background" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-[17px] leading-none truncate">
                {PARTNER.name} <span className="text-muted-foreground font-sans text-xs">· {PARTNER.age}</span>
              </h1>
              {PARTNER.verified && (
                <span className="inline-flex items-center gap-1 text-[10.5px] text-sage">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] border-plum/25 text-plum bg-plum/5 rounded-full px-2 py-0 font-normal"
              >
                {PARTNER.status}
              </Badge>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">· {PARTNER.city}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ExpiringPill hours={PARTNER.expiresInHours} />

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9"
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Search in conversation"
            >
              <Search className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Chat theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {THEMES.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("h-4 w-4 rounded-full", t.me)} />
                      {t.label}
                    </span>
                    {theme.id === t.id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 pb-3 animate-fade-in">
            <div className="flex items-center gap-2 rounded-full bg-card/80 backdrop-blur border border-border/60 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in conversation…"
                className="h-8 border-0 bg-transparent px-1 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {query && (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {hits.length ? `${activeHit + 1}/${hits.length}` : "0"}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                disabled={!hits.length}
                onClick={() => setActiveHit((i) => (i - 1 + hits.length) % hits.length)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                disabled={!hits.length}
                onClick={() => setActiveHit((i) => (i + 1) % hits.length)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Subheader: small profile preview strip */}
        {!searchOpen && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 pb-3 -mt-1">
            <div className="flex items-center gap-3 rounded-2xl bg-card/70 backdrop-blur border border-border/50 px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[12.5px] text-muted-foreground italic truncate">"{PARTNER.bio}"</p>
              <div className="ml-auto flex -space-x-2">
                {PARTNER.gallery.map((g, i) => (
                  <div key={i} className="h-7 w-7 rounded-full ring-2 ring-background overflow-hidden">
                    <img src={g} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-[11px] h-7 rounded-full px-2.5">
                View profile
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-2.5">
          <DayDivider label="Today" />
          <div className="text-center text-[11px] text-muted-foreground/80 mb-4">
            Be kind, be patient. Conversations on Eternal Bond are private and family-aware.
          </div>

          {messages.map((m) => {
            const hitIdx = hits.indexOf(m.id);
            return (
              <Bubble
                key={m.id}
                m={m}
                theme={theme}
                query={query.trim()}
                isHit={hitIdx !== -1}
                isActive={hitIdx !== -1 && hitIdx === activeHit}
                innerRef={(el) => (bubbleRefs.current[m.id] = el)}
              />
            );
          })}

          {typing && (
            <div className="flex justify-start">
              <div className={cn("px-4 py-3 rounded-2xl rounded-bl-md", theme.them)}>
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, "file");
          e.target.value = "";
        }}
      />

      {/* Composer */}
      <div className="sticky bottom-0 z-20 backdrop-blur-xl bg-background/85 border-t border-border/60">
        <div className="max-w-3xl mx-auto px-3 md:px-6 py-3 flex items-end gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground">
                <Paperclip className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-48 p-1.5">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent text-sm text-left"
              >
                <ImageIcon className="h-4 w-4 text-primary" /> Photos
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent text-sm text-left"
              >
                <FileText className="h-4 w-4 text-plum" /> Document
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent text-sm text-left"
              >
                <Camera className="h-4 w-4 text-sage-foreground" /> Camera
              </button>
            </PopoverContent>
          </Popover>

          <div className="flex-1 relative">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Write a thoughtful reply…"
              className="h-12 rounded-full pl-5 pr-12 bg-card/90 border-border/60 text-[14.5px]"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 text-muted-foreground"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={send}
            disabled={!draft.trim()}
            className="h-12 w-12 p-0 rounded-full bg-gradient-sunset text-white shadow-soft hover:shadow-glow transition-all disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-[10.5px] text-muted-foreground/70 pb-2">
          Replies typically within a day · Closes in {PARTNER.expiresInHours}h if quiet
        </p>
      </div>
    </div>
  );
}
