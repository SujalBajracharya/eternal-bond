import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  RefreshCw,
  Search,
  MailOpen,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import NavbarAuthenticated from "@/components/userSide/NavbarAuthenticated";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";

// ── Types ─────────────────────────────────────────────────────────────────────

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  sent_at: string;
};

type UserNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, string> | null;
  is_read: boolean;
  created_at: string;
};

type FeedItem =
  | { kind: "announcement"; data: Announcement; isRead: boolean }
  | { kind: "purchase"; data: UserNotification };

type Filter = "all" | "unread" | "read";

// ── Component ─────────────────────────────────────────────────────────────────

const Notifications = () => {
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [purchases, setPurchases] = useState<UserNotification[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    document.title = "Notifications — EternalBond";
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const [
        { data: ann, error: e1 },
        { data: reads, error: e2 },
        { data: profile, error: e3 },
        { data: roles, error: e4 },
        { data: userNotifs, error: e5 },
      ] = await Promise.all([
        supabase
          .from("announcements")
          .select("*")
          .order("sent_at", { ascending: false }),
        supabase
          .from("notification_reads")
          .select("announcement_id")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("gender, created_at")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("user_notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      if (e4) throw e4;
      if (e5) throw e5;

      const userGender = profile?.gender;
      const userCreatedAt = profile?.created_at
        ? new Date(profile.created_at)
        : new Date(user.createdAt);
      const userRoles = (roles ?? []).map((r) => r.role);
      const isPremium =
        userRoles.includes("premium") ||
        userRoles.includes("admin") ||
        userRoles.includes("moderator");
      const isNewUser =
        Date.now() - userCreatedAt.getTime() < 7 * 24 * 60 * 60 * 1000;

      const filteredAnn = ((ann as Announcement[]) ?? []).filter((item) => {
        const aud = item.audience;
        if (!aud || aud === "all") return true;
        if (aud === "male" && userGender === "male") return true;
        if (aud === "female" && userGender === "female") return true;
        if (aud === "premium" && isPremium) return true;
        if (aud === "new" && isNewUser) return true;
        return false;
      });

      setAnnouncements(filteredAnn);
      setReadIds(
        new Set(
          (reads ?? []).map(
            (r: { announcement_id: string }) => r.announcement_id,
          ),
        ),
      );
      setPurchases((userNotifs as UserNotification[]) ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Read handlers ──────────────────────────────────────────────────────────

  const markAnnRead = async (id: string) => {
    if (!user || readIds.has(id)) return;
    setReadIds((s) => new Set(s).add(id));
    const { error: err } = await supabase
      .from("notification_reads")
      .insert({ user_id: user.id, announcement_id: id });
    if (err && !err.message.includes("duplicate")) {
      setReadIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      toast.error("Couldn't mark as read");
    }
  };

  const markAnnUnread = async (id: string) => {
    if (!user || !readIds.has(id)) return;
    const prev = readIds;
    setReadIds((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    const { error: err } = await supabase
      .from("notification_reads")
      .delete()
      .eq("user_id", user.id)
      .eq("announcement_id", id);
    if (err) {
      setReadIds(prev);
      toast.error("Couldn't mark as unread");
    }
  };

  const markPurchaseRead = async (id: string) => {
    if (!user) return;
    setPurchases((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id);
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadAnn = announcements.filter((i) => !readIds.has(i.id));
    if (unreadAnn.length > 0) {
      const rows = unreadAnn.map((i) => ({
        user_id: user.id,
        announcement_id: i.id,
      }));
      const next = new Set(readIds);
      unreadAnn.forEach((i) => next.add(i.id));
      setReadIds(next);
      await supabase
        .from("notification_reads")
        .upsert(rows, { onConflict: "user_id,announcement_id" });
    }

    const unreadPurchaseIds = purchases
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    if (unreadPurchaseIds.length > 0) {
      setPurchases((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .in("id", unreadPurchaseIds)
        .eq("user_id", user.id);
    }

    toast.success("All caught up");
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
  };

  // ── Merged + filtered feed ─────────────────────────────────────────────────

  const feed: FeedItem[] = useMemo(() => {
    const annItems: FeedItem[] = announcements.map((a) => ({
      kind: "announcement",
      data: a,
      isRead: readIds.has(a.id),
    }));
    const purchaseItems: FeedItem[] = purchases.map((p) => ({
      kind: "purchase",
      data: p,
    }));

    const merged = [...annItems, ...purchaseItems].sort((a, b) => {
      const dateA =
        a.kind === "announcement" ? a.data.sent_at : a.data.created_at;
      const dateB =
        b.kind === "announcement" ? b.data.sent_at : b.data.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const q = query.trim().toLowerCase();
    return merged.filter((item) => {
      const isRead =
        item.kind === "announcement" ? item.isRead : item.data.is_read;
      if (filter === "unread" && isRead) return false;
      if (filter === "read" && !isRead) return false;
      if (!q) return true;
      return (
        item.data.title.toLowerCase().includes(q) ||
        item.data.body.toLowerCase().includes(q)
      );
    });
  }, [announcements, purchases, readIds, filter, query]);

  const unreadCount = useMemo(() => {
    const annUnread = announcements.filter((a) => !readIds.has(a.id)).length;
    const purchaseUnread = purchases.filter((p) => !p.is_read).length;
    return annUnread + purchaseUnread;
  }, [announcements, purchases, readIds]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <NavbarAuthenticated />
      <main
        className="min-h-screen text-foreground"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, hsl(14 90% 97%) 0%, hsl(36 70% 97%) 50%, hsl(36 60% 94%) 100%)",
        }}
      >
        <div className="container max-w-3xl py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-border/80 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <span
              className="grid place-items-center w-11 h-11 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, hsl(6 90% 70%), hsl(38 88% 65%))",
                boxShadow: "0 0 16px hsl(6 90% 70% / 0.35)",
              }}
            >
              <Bell className="w-5 h-5 text-white" />
            </span>
            <div>
              <h1 className="font-serif text-3xl leading-none text-foreground">
                Notifications
              </h1>
              <p className="text-xs uppercase tracking-[0.3em] mt-1.5 text-primary">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notifications"
                className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-full border border-border bg-secondary/40">
              {(["all", "unread", "read"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs uppercase tracking-widest rounded-full transition-all capitalize ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {unreadCount > 0 && (
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Mark all as read
              </Button>
            </div>
          )}

          {/* Feed */}
          <div className="mt-6 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl border border-border/60 bg-secondary/30 animate-pulse"
                />
              ))
            ) : error ? (
              <div className="p-8 text-center rounded-2xl border border-destructive/30 bg-destructive/5">
                <p className="text-destructive text-sm">
                  Couldn't load notifications.
                </p>
                <p className="text-xs text-destructive/70 mt-1">{error}</p>
                <Button
                  onClick={refresh}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Try again
                </Button>
              </div>
            ) : feed.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-border/60 bg-secondary/20">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/60" />
                <p className="mt-3 font-serif text-lg text-foreground">
                  {query || filter !== "all"
                    ? "Nothing matches"
                    : "No notifications yet"}
                </p>
                <p className="text-xs uppercase tracking-[0.3em] mt-2 text-muted-foreground">
                  {query || filter !== "all"
                    ? "Try a different search or filter"
                    : "We'll whisper here when something arrives"}
                </p>
              </div>
            ) : (
              feed.map((item) => {
                /* ── Purchase notification card ── */
                if (item.kind === "purchase") {
                  const n = item.data;
                  const isRead = n.is_read;
                  return (
                    <article
                      key={`purchase-${n.id}`}
                      onClick={() => markPurchaseRead(n.id)}
                      className={`group cursor-pointer rounded-2xl border p-5 transition-all ${
                        isRead
                          ? "border-border/60 bg-secondary/20"
                          : "border-emerald-400/40 bg-emerald-50/60 shadow-[0_0_24px_hsl(150_60%_50%/0.08)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`shrink-0 grid place-items-center w-9 h-9 rounded-xl ${
                            isRead
                              ? "bg-secondary text-muted-foreground"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                            <h3
                              className={`font-serif text-lg leading-tight ${
                                isRead
                                  ? "text-foreground/70 font-light"
                                  : "text-foreground font-semibold"
                              }`}
                            >
                              {n.title}
                            </h3>
                            {!isRead && (
                              <Badge className="text-[10px] uppercase tracking-widest bg-emerald-500 text-white border-0">
                                Purchase
                              </Badge>
                            )}
                          </div>
                          <p
                            className={`mt-2 text-sm whitespace-pre-wrap ${
                              isRead
                                ? "text-muted-foreground/70"
                                : "text-foreground/90"
                            }`}
                          >
                            {n.body}
                          </p>
                          <div className="mt-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }

                /* ── Announcement card ── */
                const n = item.data;
                const isRead = item.isRead;
                return (
                  <article
                    key={`ann-${n.id}`}
                    onClick={() => markAnnRead(n.id)}
                    className={`group cursor-pointer rounded-2xl border p-5 transition-all ${
                      isRead
                        ? "border-border/60 bg-secondary/20"
                        : "border-primary/30 bg-primary/5 shadow-[0_0_24px_hsl(6_86%_64%/0.08)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isRead && (
                            <span
                              className="w-2 h-2 rounded-full bg-primary"
                              style={{
                                boxShadow: "0 0 8px hsl(6 86% 64% / 0.6)",
                              }}
                            />
                          )}
                          <h3
                            className={`font-serif text-lg leading-tight ${
                              isRead
                                ? "text-foreground/70 font-light"
                                : "text-foreground font-semibold"
                            }`}
                          >
                            {n.title}
                          </h3>
                          {!isRead && (
                            <Badge
                              className="text-[10px] uppercase tracking-widest"
                              style={{
                                background:
                                  "linear-gradient(135deg, hsl(6 90% 70%), hsl(38 88% 65%))",
                                color: "white",
                              }}
                            >
                              New
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`mt-2 text-sm whitespace-pre-wrap ${
                            isRead
                              ? "text-muted-foreground/70"
                              : "text-foreground/90"
                          }`}
                        >
                          {n.body}
                        </p>
                        <div className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80">
                          <span>{new Date(n.sent_at).toLocaleString()}</span>
                          <span className="opacity-40">·</span>
                          <span>{n.audience}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isRead) markAnnUnread(n.id);
                          else markAnnRead(n.id);
                        }}
                        className="shrink-0 p-2 rounded-full text-muted-foreground hover:bg-secondary/60 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={isRead ? "Mark unread" : "Mark read"}
                        title={isRead ? "Mark as unread" : "Mark as read"}
                      >
                        {isRead ? (
                          <Mail className="w-4 h-4" />
                        ) : (
                          <MailOpen className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>
      <ScrollToTopButton />
    </>
  );
};

export default Notifications;
