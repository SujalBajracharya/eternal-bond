import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  RefreshCw,
  Search,
  MailOpen,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import NavbarAuthenticated from "@/components/userSide/NavbarAuthenticated";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  sent_at: string;
};

type Filter = "all" | "unread" | "read";

const Notifications = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
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
      ]);

      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      if (e4) throw e4;

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

      const filteredAnnouncements = ((ann as Announcement[]) ?? []).filter(
        (item) => {
          const aud = item.audience;
          if (!aud || aud === "all") return true;
          if (aud === "male" && userGender === "male") return true;
          if (aud === "female" && userGender === "female") return true;
          if (aud === "premium" && isPremium) return true;
          if (aud === "new" && isNewUser) return true;
          return false;
        },
      );

      setItems(filteredAnnouncements);
      setReadIds(
        new Set(
          (reads ?? []).map(
            (r: { announcement_id: string }) => r.announcement_id,
          ),
        ),
      );
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

  const markRead = async (id: string) => {
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

  const markUnread = async (id: string) => {
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

  const markAllRead = async () => {
    if (!user) return;
    const unread = items.filter((i) => !readIds.has(i.id));
    if (unread.length === 0) return;
    const rows = unread.map((i) => ({
      user_id: user.id,
      announcement_id: i.id,
    }));
    const next = new Set(readIds);
    unread.forEach((i) => next.add(i.id));
    setReadIds(next);
    const { error: err } = await supabase
      .from("notification_reads")
      .upsert(rows, { onConflict: "user_id,announcement_id" });
    if (err) toast.error("Couldn't mark all read");
    else toast.success("All caught up");
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const isRead = readIds.has(i.id);
      if (filter === "unread" && isRead) return false;
      if (filter === "read" && !isRead) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q)
      );
    });
  }, [items, readIds, filter, query]);

  const unreadCount =
    items.length - items.filter((i) => readIds.has(i.id)).length;

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

          {/* List */}
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
            ) : filtered.length === 0 ? (
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
              filtered.map((n) => {
                const isRead = readIds.has(n.id);
                return (
                  <article
                    key={n.id}
                    onClick={() => markRead(n.id)}
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
                          if (isRead) markUnread(n.id);
                          else markRead(n.id);
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
