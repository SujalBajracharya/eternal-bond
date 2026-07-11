import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Search,
  UserMinus,
  Undo2,
  Clock,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  Hourglass,
  Gamepad2,
  AlertTriangle,
  RefreshCw,
  Eye,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-audit";

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type MatchRecord = {
  id: string;
  created_at: string;
  expires_at: string | null;
  is_game_night: boolean | null;
  status: "active" | "expired" | "unmatched" | "force_ended" | null;
  user_one: UserProfile | null;
  user_two: UserProfile | null;
};

type MessageRecord = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  extension: string | null;
  payload: any;
};

const AdminMatches = () => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gameNightFilter, setGameNightFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Inspect Chat Dialog state
  const [inspectMatch, setInspectMatch] = useState<MatchRecord | null>(null);
  const [inspectMessages, setInspectMessages] = useState<MessageRecord[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Copied match ID state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          id,
          created_at,
          expires_at,
          is_game_night,
          status,
          user_one:profiles!user_one_id(id, full_name, email, avatar_url),
          user_two:profiles!user_two_id(id, full_name, email, avatar_url)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load match records: " + error.message);
      } else {
        setMatches((data as any) || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Unexpected error loading match records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Fetch messages when inspectMatch changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!inspectMatch) {
        setInspectMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, content, sender_id, created_at, extension, payload")
          .eq("match_id", inspectMatch.id)
          .order("created_at", { ascending: true });

        if (error) {
          toast.error("Failed to load messages: " + error.message);
        } else {
          setInspectMessages((data as any) || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Unexpected error loading messages.");
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [inspectMatch]);

  // Actions
  const handleForceUnmatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: "force_ended" })
        .eq("id", matchId);

      if (error) {
        toast.error("Failed to unmatch: " + error.message);
        return;
      }

      await logAdminAction("match_force_ended", "match", matchId);
      toast.success("Match has been force-unmatched");
      fetchMatches();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error during unmatching.");
    }
  };

  const handleRestoreMatch = async (matchId: string) => {
    try {
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7); // Default to 7 days from now

      const { error } = await supabase
        .from("matches")
        .update({
          status: "active",
          expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", matchId);

      if (error) {
        toast.error("Failed to restore: " + error.message);
        return;
      }

      await logAdminAction("match_restored", "match", matchId, {
        expires_at: newExpiresAt.toISOString(),
      });
      toast.success("Match reactivated & extended by 7 days");
      fetchMatches();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error restoring match.");
    }
  };

  const handleExtendMatch = async (
    matchId: string,
    currentExpiresAt: string | null,
  ) => {
    try {
      const baseDate = currentExpiresAt
        ? new Date(currentExpiresAt)
        : new Date();
      const newExpiresAt = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours

      const { error } = await supabase
        .from("matches")
        .update({
          expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", matchId);

      if (error) {
        toast.error("Failed to extend match: " + error.message);
        return;
      }

      await logAdminAction("match_extended_24h", "match", matchId, {
        expires_at: newExpiresAt.toISOString(),
      });
      toast.success("Match extended by 24 hours");
      fetchMatches();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error extending match.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success("Match ID copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = matches.length;
    const active = matches.filter((m) => m.status === "active").length;
    const expired = matches.filter((m) => m.status === "expired").length;
    const unmatched = matches.filter(
      (m) => m.status === "unmatched" || m.status === "force_ended",
    ).length;

    return { total, active, expired, unmatched };
  }, [matches]);

  const cards = [
    {
      label: "Total matches",
      value: metrics.total,
      icon: Heart,
      color: "text-rose-500 bg-rose-500/10",
    },
    {
      label: "Active matches",
      value: metrics.active,
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Expired matches",
      value: metrics.expired,
      icon: Hourglass,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Unmatched pairs",
      value: metrics.unmatched,
      icon: UserMinus,
      color: "text-slate-500 bg-slate-500/10",
    },
  ];

  // Filtering and Sorting
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.user_one?.full_name?.toLowerCase().includes(q) ||
          m.user_one?.email?.toLowerCase().includes(q) ||
          m.user_two?.full_name?.toLowerCase().includes(q) ||
          m.user_two?.email?.toLowerCase().includes(q),
      );
    }

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Game Night Filter
    if (gameNightFilter !== "all") {
      const wantGameNight = gameNightFilter === "yes";
      result = result.filter((m) => !!m.is_game_night === wantGameNight);
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [matches, searchQuery, statusFilter, gameNightFilter, sortBy]);

  const getStatusBadge = (status: MatchRecord["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            Active
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Expired
          </Badge>
        );
      case "unmatched":
        return (
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 border-slate-200"
          >
            Unmatched
          </Badge>
        );
      case "force_ended":
        return (
          <Badge
            variant="destructive"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Force Ended
          </Badge>
        );
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  return (
    <AdminLayout title="Match Management">
      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((c) => (
          <Card
            key={c.label}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${c.color} transition-colors`}>
                <c.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                  {c.label}
                </div>
                <div className="text-3xl font-bold mt-1 text-foreground">
                  {loading ? "..." : c.value}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Table Card */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">
              Match Registry & Activity
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Monitor pair relationships, review conversation content logs, and
              handle dispute moderations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatches}
            className="self-start md:self-auto gap-1"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Registry
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* Controls Bar */}
          <div className="p-4 bg-muted/10 border-b flex flex-wrap gap-3 items-center">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 h-9"
                placeholder="Search names, emails, match ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                  <SelectItem value="force_ended">Force Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Game Night Filter */}
            <div className="w-44">
              <Select
                value={gameNightFilter}
                onValueChange={setGameNightFilter}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Mode: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mode: All</SelectItem>
                  <SelectItem value="yes">Game Night Matches</SelectItem>
                  <SelectItem value="no">Standard Matches</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="w-40 sm:ml-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sort: Newest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Loading match registry database...
                </span>
              </div>
            ) : filteredMatches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Match ID</TableHead>
                    <TableHead>User Partner One</TableHead>
                    <TableHead>User Partner Two</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Expiry Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right pr-6">Mod Tools</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((m) => {
                    const isCopied = copiedId === m.id;
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/30">
                        {/* Match ID Column */}
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <span title={m.id}>{m.id.substring(0, 8)}...</span>
                            <button
                              onClick={() => copyToClipboard(m.id)}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy Full ID"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </TableCell>

                        {/* User One Column */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                              {m.user_one?.avatar_url ? (
                                <img
                                  src={m.user_one.avatar_url}
                                  alt={m.user_one.full_name || ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary uppercase">
                                  {(m.user_one?.full_name || "U1").substring(
                                    0,
                                    2,
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div
                                className="text-sm font-semibold truncate max-w-[150px]"
                                title={m.user_one?.full_name || "Anonymous"}
                              >
                                {m.user_one?.full_name || "Anonymous"}
                              </div>
                              <div
                                className="text-[11px] text-muted-foreground truncate max-w-[150px]"
                                title={m.user_one?.email || ""}
                              >
                                {m.user_one?.email || "No Email"}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* User Two Column */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                              {m.user_two?.avatar_url ? (
                                <img
                                  src={m.user_two.avatar_url}
                                  alt={m.user_two.full_name || ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary uppercase">
                                  {(m.user_two?.full_name || "U2").substring(
                                    0,
                                    2,
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div
                                className="text-sm font-semibold truncate max-w-[150px]"
                                title={m.user_two?.full_name || "Anonymous"}
                              >
                                {m.user_two?.full_name || "Anonymous"}
                              </div>
                              <div
                                className="text-[11px] text-muted-foreground truncate max-w-[150px]"
                                title={m.user_two?.email || ""}
                              >
                                {m.user_two?.email || "No Email"}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Created Date */}
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </TableCell>

                        {/* Expiry Time */}
                        <TableCell className="text-xs text-muted-foreground">
                          {m.expires_at ? (
                            <span
                              title={new Date(m.expires_at).toLocaleString()}
                            >
                              {new Date(m.expires_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400">Never</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>{getStatusBadge(m.status)}</TableCell>

                        {/* Game Night Mode */}
                        <TableCell>
                          {m.is_game_night ? (
                            <Badge
                              className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200"
                              variant="outline"
                            >
                              <Gamepad2 className="w-3 h-3 mr-1 shrink-0" />
                              Game Night
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Standard
                            </span>
                          )}
                        </TableCell>

                        {/* Mod Actions */}
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1.5">
                            {/* Inspect Chat */}
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Inspect Conversation History"
                              onClick={() => setInspectMatch(m)}
                              className="h-8 px-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                            >
                              <MessageSquare className="w-4 h-4 mr-1 shrink-0" />
                              Inspect
                            </Button>

                            {/* Restore Match */}
                            {m.status !== "active" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Reactivate Match relationship"
                                onClick={() => handleRestoreMatch(m.id)}
                                className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <Undo2 className="w-4 h-4 mr-1" />
                                Reactivate
                              </Button>
                            ) : (
                              <>
                                {/* Extend Match */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Extend expiration by 24h"
                                  onClick={() =>
                                    handleExtendMatch(m.id, m.expires_at)
                                  }
                                  className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  +24h
                                </Button>

                                {/* Force Unmatch */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Force Unmatch match relationship"
                                  onClick={() => handleForceUnmatch(m.id)}
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <UserMinus className="w-4 h-4 mr-1" />
                                  Unmatch
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Search className="w-8 h-8 text-slate-300" />
                <p className="font-semibold text-slate-700">
                  No match records found
                </p>
                <p className="text-sm">
                  Try adjustment parameters, filter options, or query filters.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inspect Conversations Dialog */}
      <Dialog
        open={!!inspectMatch}
        onOpenChange={(o) => !o && setInspectMatch(null)}
      >
        <DialogContent className="max-w-2xl overflow-hidden p-0 gap-0">
          <DialogHeader className="p-6 border-b bg-muted/20">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Auditing Chat Logs
            </DialogTitle>
            {inspectMatch && (
              <div className="text-sm text-muted-foreground mt-2 flex items-center justify-between">
                <span>
                  Match Partner Log:{" "}
                  <strong>
                    {inspectMatch.user_one?.full_name || "Anonymous"}
                  </strong>{" "}
                  &{" "}
                  <strong>
                    {inspectMatch.user_two?.full_name || "Anonymous"}
                  </strong>
                </span>
                <span className="font-mono text-[10px]">
                  Match ID: {inspectMatch.id.substring(0, 12)}...
                </span>
              </div>
            )}
          </DialogHeader>

          {/* Conversation History Timeline Panel */}
          <div className="p-6 max-h-[450px] overflow-y-auto space-y-4 bg-muted/5">
            {loadingMessages ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                Retrieving dialogue history...
              </div>
            ) : inspectMessages.length > 0 ? (
              inspectMessages.map((msg) => {
                const isUserOne = msg.sender_id === inspectMatch?.user_one?.id;
                const senderProfile = isUserOne
                  ? inspectMatch?.user_one
                  : inspectMatch?.user_two;

                // Checking if message has an attachment payload
                let payloadObj = msg.payload;
                if (typeof payloadObj === "string") {
                  try {
                    payloadObj = JSON.parse(payloadObj);
                  } catch (e) {}
                }
                const isImage =
                  payloadObj?.type === "image" ||
                  (msg.extension &&
                    /^(jpg|jpeg|png|gif|webp)$/i.test(msg.extension));

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isUserOne ? "justify-start" : "justify-end"
                    }`}
                  >
                    {isUserOne && (
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-muted shrink-0 mt-0.5">
                        {senderProfile?.avatar_url ? (
                          <img
                            src={senderProfile.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-primary/20 text-primary">
                            {(senderProfile?.full_name || "U").substring(0, 1)}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col max-w-[70%]">
                      {/* Name Label */}
                      <span className="text-[11px] font-semibold text-muted-foreground mb-1 px-1">
                        {senderProfile?.full_name || "Anonymous"}
                      </span>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          isUserOne
                            ? "bg-slate-100 text-slate-900 rounded-tl-none border"
                            : "bg-primary text-primary-foreground rounded-tr-none"
                        }`}
                      >
                        {isImage ? (
                          <div className="overflow-hidden rounded-lg mb-1 max-w-[240px]">
                            <img
                              src={msg.content}
                              alt="User attachment"
                              className="max-h-48 object-cover rounded-md"
                            />
                            {payloadObj?.fileName && (
                              <span className="block text-[10px] mt-1 opacity-80 truncate">
                                {payloadObj.fileName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                        <span
                          className={`block text-[9px] mt-1 text-right ${
                            isUserOne
                              ? "text-slate-500"
                              : "text-primary-foreground/70"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {!isUserOne && (
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-muted shrink-0 mt-0.5">
                        {senderProfile?.avatar_url ? (
                          <img
                            src={senderProfile.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-accent/20 text-accent-foreground">
                            {(senderProfile?.full_name || "U").substring(0, 1)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-1">
                <MessageSquare className="w-8 h-8 text-slate-300" />
                <p className="font-semibold text-sm text-slate-700">
                  No dialogue exchange logs
                </p>
                <p className="text-xs">
                  Matched partners have not exchanged messages.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-muted/10 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectMatch(null)}
            >
              Close Audit Panel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMatches;
