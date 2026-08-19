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
  Loader2,
  UserMinus,
  Pencil,
  Flag,
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import match1 from "@/assets/match-1.jpg";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ReportMessageDialog from "@/components/ReportMessageDialog";
import NavbarAuthenticated from "@/components/userSide/NavbarAuthenticated";
import { useEntitlements } from "@/hooks/useEntitlements";
import { extendChat } from "@/api/monetization";
import { CheckoutDialog } from "@/components/premium/CheckoutDialog";

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

type Partner = {
  id: string;
  name: string;
  age: number;
  city: string;
  photo: string;
  status: string;
  verified: boolean;
  expiresAt: string | null;
  expiresInHours: number;
  bio: string;
  gallery: string[];
};

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
      {hours <= 0 ? "Expired" : `Closes in ${hours}h`}
    </span>
  );
}

function StatusTicks({ status }: { status?: MsgStatus }) {
  if (!status) return null;
  if (status === "sent") return <Check className="h-3 w-3 opacity-70" />;
  if (status === "delivered")
    return <CheckCheck className="h-3 w-3 opacity-70" />;
  // read
  return <CheckCheck className="h-3 w-3 text-sky-300" />;
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"),
  );
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
      <a
        href={a.url}
        target="_blank"
        rel="noreferrer"
        className="block -mx-1 -mt-1 mb-1.5 overflow-hidden rounded-xl"
      >
        <img
          src={a.url}
          alt={a.name}
          className="max-h-64 w-full object-cover"
        />
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
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center",
          mine ? "bg-white/20" : "bg-background",
        )}
      >
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
  onReport,
}: {
  m: Msg;
  theme: Theme;
  query: string;
  isHit: boolean;
  isActive: boolean;
  innerRef?: (el: HTMLDivElement | null) => void;
  onReport?: (m: Msg) => void;
}) {
  const bubbleContent = (
    <div
      className={cn(
        "max-w-[78%] md:max-w-[60%] px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed shadow-sm",
        "animate-fade-in transition-all",
        m.fromMe
          ? cn(theme.me, "rounded-br-md")
          : cn(theme.them, "rounded-bl-md"),
        isActive &&
          "ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
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
  );

  // Wrap incoming (non-own) messages in a context menu for reporting
  if (!m.fromMe && onReport) {
    return (
      <div ref={innerRef} className={cn("flex w-full", "justify-start")}>
        <ContextMenu>
          <ContextMenuTrigger asChild>{bubbleContent}</ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => onReport(m)}
            >
              <Flag className="h-3.5 w-3.5 mr-2" />
              Report message
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    );
  }

  return (
    <div
      ref={innerRef}
      className={cn("flex w-full", m.fromMe ? "justify-end" : "justify-start")}
    >
      {bubbleContent}
    </div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="h-px flex-1 bg-border/60" />
      <span className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const { id: matchId } = useParams();
  const { session } = useAuth();
  const { entitlements, refresh: refreshEntitlements } = useEntitlements();
  const canSeeReadReceipts = entitlements?.readReceiptsEnabled === true;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [nickname, setNickname] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeHit, setActiveHit] = useState(0);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [showUnmatch, setShowUnmatch] = useState(false);
  const [unmatching, setUnmatching] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<Msg | null>(null);
  const [extendingChat, setExtendingChat] = useState(false);
  const [extendCheckoutOpen, setExtendCheckoutOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session?.user?.id || !matchId) return;

    const loadData = async () => {
      try {
        const currentUserId = session.user.id;

        const { data: match, error: matchError } = await supabase
          .from("matches")
          .select("*")
          .eq("id", matchId)
          .single();

        if (matchError || !match) throw matchError;

        const partnerId =
          match.user_one_id === currentUserId
            ? match.user_two_id
            : match.user_one_id;

        let expiresInHours = 0;
        if (match.expires_at) {
          const diff =
            new Date(match.expires_at).getTime() - new Date().getTime();
          if (diff > 0) expiresInHours = Math.ceil(diff / (1000 * 60 * 60));
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", partnerId)
          .single();

        if (profileError || !profile) throw profileError;

        const { data: photos, error: photosError } = await supabase
          .from("profile_photos_mapping")
          .select("photo_url")
          .eq("profile_id", partnerId);

        const gallery = photos?.map((p) => p.photo_url) || [];
        if (profile.avatar_url && !gallery.includes(profile.avatar_url)) {
          gallery.unshift(profile.avatar_url);
        }

        const calculateAge = (dobString: string | null) => {
          if (!dobString) return 28;
          const dob = new Date(dobString);
          if (isNaN(dob.getTime())) return 28;
          const diff = Date.now() - dob.getTime();
          return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        };

        const familyTypeLabel = profile.family_type
          ? profile.family_type.charAt(0).toUpperCase() +
            profile.family_type.slice(1) +
            " family"
          : "Family-assisted";

        setPartner({
          id: partnerId,
          name: profile.full_name || "Anonymous",
          age: calculateAge(profile.date_of_birth),
          city: profile.location || "India",
          photo: profile.avatar_url || match1, // match1 fallback
          status: `${familyTypeLabel} • ${profile.kyc_status === "verified" ? "Verified" : "Unverified"}`,
          verified: profile.kyc_status === "verified",
          expiresAt: match.expires_at,
          expiresInHours,
          bio: profile.bio || "Looking for a lifetime connection",
          gallery: gallery.length > 0 ? gallery : [match1],
        });

        const { data: msgs, error: msgsError } = await supabase
          .from("messages")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true });

        if (msgsError) throw msgsError;

        const mappedMsgs: Msg[] = msgs.map((m) => {
          let payloadObj = m.payload;
          if (typeof payloadObj === "string") {
            try {
              payloadObj = JSON.parse(payloadObj);
            } catch (e) {}
          }

          const isImage =
            payloadObj?.type === "image" ||
            (m.extension && /^(jpg|jpeg|png|gif|webp)$/i.test(m.extension));
          return {
            id: m.id,
            text: isImage ? undefined : m.content,
            fromMe: m.sender_id === currentUserId,
            at: new Date(m.created_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            status: m.is_read && canSeeReadReceipts ? "read" : "delivered",
            attachment: isImage
              ? {
                  kind: "image",
                  url: m.content,
                  name: payloadObj?.fileName || "image",
                }
              : undefined,
          };
        });

        setMessages(mappedMsgs);

        const unreadMsgs = msgs
          .filter((m) => !m.is_read && m.sender_id !== currentUserId)
          .map((m) => m.id);
        if (unreadMsgs.length > 0) {
          await supabase
            .from("messages")
            .update({ is_read: true })
            .in("id", unreadMsgs);
        }

        // Load persisted theme + nickname
        const { data: prefs } = await supabase
          .from("match_preferences" as any)
          .select("theme, nickname")
          .eq("match_id", matchId)
          .eq("user_id", currentUserId)
          .maybeSingle();

        if (prefs) {
          const saved = THEMES.find((t) => t.id === (prefs as any).theme);
          if (saved) setTheme(saved);
          const nick = (prefs as any).nickname;
          if (nick) setNickname(nick);
        }
      } catch (e) {
        console.error("Failed to load chat data", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const subscription = supabase
      .channel(`public:messages:match_id=${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          let payloadObj = newMsg.payload;
          if (typeof payloadObj === "string") {
            try {
              payloadObj = JSON.parse(payloadObj);
            } catch (e) {}
          }
          const isImage =
            payloadObj?.type === "image" ||
            (newMsg.extension &&
              /^(jpg|jpeg|png|gif|webp)$/i.test(newMsg.extension));

          const mappedNewMsg: Msg = {
            id: newMsg.id,
            text: isImage ? undefined : newMsg.content,
            fromMe: newMsg.sender_id === session.user.id,
            at: new Date(newMsg.created_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            status: newMsg.is_read && canSeeReadReceipts ? "read" : "delivered",
            attachment: isImage
              ? {
                  kind: "image",
                  url: newMsg.content,
                  name: payloadObj?.fileName || "image",
                }
              : undefined,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, mappedNewMsg];
          });

          if (newMsg.sender_id !== session.user.id) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMsg.id
                ? { ...m, status: updatedMsg.is_read && canSeeReadReceipts ? "read" : "delivered" }
                : m,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session, matchId]);

  const handleExtendChat = async () => {
    if (!session?.access_token || !matchId || extendingChat) return;
    setExtendingChat(true);
    try {
      const result = await extendChat(session.access_token, matchId);
      const nextExpiry = result.newExpiry === "permanent" ? null : result.newExpiry;
      const nextHours = nextExpiry
        ? Math.max(0, Math.ceil((new Date(nextExpiry).getTime() - Date.now()) / (1000 * 60 * 60)))
        : 0;
      setPartner((currentPartner) => currentPartner
        ? { ...currentPartner, expiresAt: nextExpiry, expiresInHours: nextHours }
        : currentPartner);
      await refreshEntitlements();
      toast.success("Chat extended", {
        description: nextExpiry ? "You have 24 more hours to continue the conversation." : "This chat no longer expires.",
      });
    } catch (err: any) {
      toast.error("Could not extend this chat", {
        description: err.message || "Please try again.",
      });
    } finally {
      setExtendingChat(false);
    }
  };

  useEffect(() => {
    const pendingMatchId = sessionStorage.getItem("eb_pending_extend_chat_match_id");
    if (
      !pendingMatchId ||
      pendingMatchId !== matchId ||
      !partner ||
      (entitlements?.pendingChatExtensions ?? 0) <= 0 ||
      extendingChat
    ) {
      return;
    }

    sessionStorage.removeItem("eb_pending_extend_chat_match_id");
    void handleExtendChat();
    // The pending match id and refreshed entitlement guard this post-checkout action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, partner?.id, entitlements?.pendingChatExtensions, extendingChat]);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as string[];
    return messages
      .filter((m) => m.text?.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [query, messages]);

  useEffect(() => {
    if (!searchOpen) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, typing, searchOpen]);

  useEffect(() => {
    setActiveHit(0);
  }, [query]);

  useEffect(() => {
    if (!hits.length) return;
    const id = hits[activeHit];
    bubbleRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeHit, hits]);

  const savePrefs = async (updates: {
    theme?: string;
    nickname?: string | null;
  }) => {
    if (!matchId || !session?.user?.id) return;
    await supabase.from("match_preferences" as any).upsert(
      {
        match_id: matchId,
        user_id: session.user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,user_id" },
    );
  };

  const changeTheme = (t: Theme) => {
    setTheme(t);
    savePrefs({ theme: t.id });
  };

  const handleUnmatch = async () => {
    if (!matchId) return;
    setUnmatching(true);
    try {
      await supabase.from("matches").delete().eq("id", matchId);
      navigate("/matches");
    } catch (e) {
      console.error("Unmatch failed", e);
    } finally {
      setUnmatching(false);
      setShowUnmatch(false);
    }
  };

  const handleSaveNickname = async () => {
    setSavingNickname(true);
    const val = nicknameInput.trim() || null;
    await savePrefs({ nickname: val });
    setNickname(val);
    setSavingNickname(false);
    setShowNickname(false);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !matchId || !session?.user?.id) return;

    setDraft("");

    const id = crypto.randomUUID();
    const at = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    setMessages((m) => [...m, { id, text, fromMe: true, at, status: "sent" }]);

    try {
      const { error } = await supabase.from("messages").insert({
        id,
        content: text,
        created_at: new Date().toISOString(),
        is_read: false,
        match_id: matchId,
        sender_id: session.user.id,
      });
      if (error) throw error;
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPreviewFile(e.target.files[0]);
    }
  };

  const handleFileConfirm = async (file: File) => {
    const kind = file.type.startsWith("image/") ? "image" : "file";
    setPreviewFile(null);
    if (!matchId || !session?.user?.id) return;

    const at = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const id = crypto.randomUUID();

    const optimisticMsg: Msg = {
      id,
      fromMe: true,
      at,
      status: "sent",
      attachment: {
        kind,
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        url: kind === "image" ? URL.createObjectURL(file) : undefined,
      },
    };

    setMessages((m) => [...m, optimisticMsg]);

    try {
      let contentUrl = "";
      const extension = file.name.split(".").pop() || "";

      if (kind === "image") {
        const fileName = `${matchId}/${id}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(fileName);
        contentUrl = publicUrlData.publicUrl;
      } else {
        contentUrl = file.name;
      }

      const { error } = await supabase.from("messages").insert({
        id,
        content: contentUrl,
        extension,
        payload: {
          type: kind,
          fileName: file.name,
          mimeType: file.type,
        },
        created_at: new Date().toISOString(),
        is_read: false,
        match_id: matchId,
        sender_id: session.user.id,
      });

      if (error) throw error;
    } catch (err) {
      console.error("Failed to upload/send file", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Match not found.</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col transition-colors duration-500",
        theme.bg,
      )}
    >
      {/* Header */}
      <NavbarAuthenticated />
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="max-w-3xl mx-auto px-3 md:px-6 py-3 flex items-center gap-3">
          <Link to="/matches">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="relative shrink-0">
            <div className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <img
                src={partner.photo}
                alt={partner.name}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-sage ring-2 ring-background" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-[17px] leading-none truncate">
                {nickname || partner.name}{" "}
                <span className="text-muted-foreground font-sans text-xs">
                  · {partner.age}
                </span>
              </h1>
              {partner.verified && (
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
                {partner.status}
              </Badge>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                · {partner.city}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {entitlements?.chatExpiryDisabled || !partner.expiresAt ? (
              <Badge variant="outline" className="text-[10px] rounded-full border-sage/30 text-sage-foreground bg-sage/10">
                No expiry
              </Badge>
            ) : (
              <ExpiringPill hours={partner.expiresInHours} />
            )}

            {!entitlements?.chatExpiryDisabled && partner.expiresAt && partner.expiresInHours <= 24 && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-[10px] px-2.5 h-8"
                disabled={extendingChat}
                onClick={() => {
                  if ((entitlements?.pendingChatExtensions ?? 0) > 0) {
                    void handleExtendChat();
                  } else {
                    sessionStorage.setItem("eb_pending_extend_chat_match_id", matchId || "");
                    setExtendCheckoutOpen(true);
                  }
                }}
              >
                {extendingChat && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {extendingChat ? "Extending…" : "Extend Chat"}
              </Button>
            )}

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
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">
                  Chat theme
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {THEMES.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => changeTheme(t)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("h-4 w-4 rounded-full", t.me)} />
                      {t.label}
                    </span>
                    {theme.id === t.id && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs">
                  Options
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setNicknameInput(nickname || "");
                    setShowNickname(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  Set nickname
                  {nickname && (
                    <span className="ml-auto text-[11px] text-muted-foreground truncate max-w-[80px]">
                      {nickname}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setShowUnmatch(true)}
                >
                  <UserMinus className="h-3.5 w-3.5 mr-2" />
                  Unmatch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                onClick={() =>
                  setActiveHit((i) => (i - 1 + hits.length) % hits.length)
                }
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
              <p className="text-[12.5px] text-muted-foreground italic truncate">
                "{partner.bio}"
              </p>
              <div className="ml-auto flex -space-x-2">
                {partner.gallery.slice(0, 3).map((g, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full ring-2 ring-background overflow-hidden"
                  >
                    <img
                      src={g}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] h-7 rounded-full px-2.5"
                onClick={() => navigate(`/profile/${partner.id}`)}
              >
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
            Be kind, be patient. Conversations on Eternal Bond are private and
            family-aware.
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
                onReport={(msg) => setReportingMessage(msg)}
              />
            );
          })}

          {typing && (
            <div className="flex justify-start">
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl rounded-bl-md",
                  theme.them,
                )}
              >
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
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e);
          e.target.value = "";
        }}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg leading-none">
                Send attachment
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setPreviewFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {previewFile.type.startsWith("image/") ? (
              <div className="rounded-xl overflow-hidden border border-border/50 mb-4 bg-black/5">
                <img
                  src={URL.createObjectURL(previewFile)}
                  className="w-full max-h-64 object-contain"
                  alt="Preview"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/60 rounded-xl mb-4 border border-border/50">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm truncate text-foreground/90 font-medium">
                  {previewFile.name}
                </span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                className="rounded-full px-5"
                onClick={() => setPreviewFile(null)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full px-6 bg-gradient-sunset text-white shadow-soft"
                onClick={() => handleFileConfirm(previewFile)}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" /> Send
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Unmatch confirmation */}
      {showUnmatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 grid place-items-center shrink-0">
                <UserMinus className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="font-serif text-lg leading-none">Unmatch?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              This will permanently remove your match with{" "}
              <strong>{nickname || partner.name}</strong> and delete all
              messages. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                className="rounded-full px-5"
                onClick={() => setShowUnmatch(false)}
                disabled={unmatching}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-full px-5"
                onClick={handleUnmatch}
                disabled={unmatching}
              >
                {unmatching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Unmatch"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Set nickname dialog */}
      {showNickname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg leading-none">
                Set a nickname
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setShowNickname(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Only visible to you — {partner.name} will never see this.
            </p>
            <input
              autoFocus
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveNickname()}
              placeholder={`e.g. "My favourite person"`}
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mb-5"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                className="rounded-full px-5"
                onClick={() => setShowNickname(false)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full px-6 bg-gradient-sunset text-white"
                onClick={handleSaveNickname}
                disabled={savingNickname}
              >
                {savingNickname ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report message dialog */}
      {partner && (
        <ReportMessageDialog
          open={!!reportingMessage}
          onOpenChange={(open) => !open && setReportingMessage(null)}
          messageContent={
            reportingMessage?.text ||
            reportingMessage?.attachment?.url ||
            reportingMessage?.attachment?.name ||
            ""
          }
          messageId={reportingMessage?.id || ""}
          reportedUserId={partner.id}
          onSuccess={() =>
            toast.success("Report submitted. Our team will review it.")
          }
        />
      )}

      {/* Composer */}
      <div className="sticky bottom-0 z-20 backdrop-blur-xl bg-background/85 border-t border-border/60">
        <div className="max-w-3xl mx-auto px-3 md:px-6 py-3 flex items-end gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 text-muted-foreground"
              >
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
          Replies typically within a day · {entitlements?.chatExpiryDisabled || !partner.expiresAt ? "This chat does not expire" : `Closes in ${partner.expiresInHours}h if quiet`}
          {entitlements?.pendingChatExtensions ? ` · ${entitlements.pendingChatExtensions} extension${entitlements.pendingChatExtensions === 1 ? "" : "s"} available` : ""}
        </p>
      </div>

      <CheckoutDialog
        open={extendCheckoutOpen}
        onOpenChange={setExtendCheckoutOpen}
        productId="extend-chat"
        title="Extend this chat"
        description="Give this conversation more room to breathe."
        price={99}
        appliesWhen="Your chat is extended after payment is verified."
        receiptLabel="Chat extension purchased"
        context={{ conversationId: matchId || "" }}
      />
    </div>
  );
}
