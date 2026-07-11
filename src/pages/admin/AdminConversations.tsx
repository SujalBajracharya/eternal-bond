import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MessageSquare, Image as ImageIcon, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-audit";

/**
 * Conversation monitoring is restricted to reported cases only.
 * Lists open/investigating reports with chat history context
 * and distinguishes between photo and message reports.
 */
type Report = {
  id: string;
  reported_user_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  evidence_urls: string[];
  priority: string;
  status: string;
  created_at: string;
};

const priorityColor: Record<string, string> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const AdminConversations = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Report | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_reports")
      .select(
        "id, reported_user_id, reporter_id, reason, details, evidence_urls, priority, status, created_at",
      )
      .in("status", ["open", "investigating"] as never)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const all = (data as Report[]) ?? [];
    setReports(all);

    // Resolve user names
    const ids = [
      ...new Set(all.flatMap((r) => [r.reporter_id, r.reported_user_id])),
    ];
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      const map: Record<string, string> = {};
      profiles?.forEach((p) => {
        map[p.id] = p.full_name ?? "Unknown User";
      });
      setUserNames(map);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("user_reports")
      .update({
        status: status as never,
        resolved_at:
          status === "resolved" || status === "dismissed"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    await logAdminAction(`report_${status}`, "user_report", id);
    toast.success(`Report marked as ${status}`);
    setViewing(null);
    load();
  };

  /** Determine whether a report is about a message (vs. a photo) */
  const isMessageReport = (r: Report) =>
    r.evidence_urls?.some((u) => u.startsWith("msg:"));

  /** Extract the quoted message from the details field */
  const extractReportedMessage = (r: Report) => {
    if (!r.details) return null;
    const match = r.details.match(/^\[Reported Message\]:\s*"(.+?)"/s);
    return match ? match[1] : null;
  };

  return (
    <AdminLayout title="Conversation Monitoring">
      <p className="text-sm text-muted-foreground mb-4">
        Chat access is only unlocked for reported cases. Select a report to
        review the associated message or photo evidence.
      </p>
      {loading ? (
        <div className="p-12 grid place-items-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map((r) => {
            const isMsgReport = isMessageReport(r);
            const quotedMsg = isMsgReport ? extractReportedMessage(r) : null;
            return (
              <Card key={r.id} className="overflow-hidden">
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                  {isMsgReport ? (
                    <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-amber-500 shrink-0" />
                  )}
                  <CardTitle className="text-base capitalize flex-1">
                    {r.reason.replace(/_/g, " ")}
                  </CardTitle>
                  <Badge variant={priorityColor[r.priority] as never}>
                    {r.priority}
                  </Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-foreground">
                      {userNames[r.reporter_id] ?? r.reporter_id.slice(0, 8)}
                    </span>
                    <span>reported</span>
                    <span className="font-medium text-foreground">
                      {userNames[r.reported_user_id] ??
                        r.reported_user_id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Show a preview of the reported message */}
                  {quotedMsg && (
                    <div className="rounded-lg bg-muted/60 border border-border/50 px-3 py-2 text-sm italic text-foreground/80 line-clamp-3">
                      "{quotedMsg}"
                    </div>
                  )}

                  {/* Show photo evidence thumbnails */}
                  {!isMsgReport &&
                    r.evidence_urls.length > 0 && (
                      <div className="flex gap-2">
                        {r.evidence_urls.slice(0, 3).map((u) => (
                          <a
                            key={u}
                            href={u}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-14 w-14 rounded-lg overflow-hidden border border-border/50"
                          >
                            <img
                              src={u}
                              alt="Evidence"
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                  <div className="text-[11px] text-muted-foreground/70">
                    {new Date(r.created_at).toLocaleString()}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setViewing(r)}
                    >
                      View details
                    </Button>
                    {r.status === "open" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setStatus(r.id, "investigating")}
                      >
                        Investigate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setStatus(r.id, "resolved")}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setStatus(r.id, "dismissed")}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {reports.length === 0 && (
            <div className="p-12 text-center text-muted-foreground md:col-span-2">
              No conversations awaiting review.
            </div>
          )}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="text-sm">
                <strong>Reason:</strong>{" "}
                <span className="capitalize">
                  {viewing.reason.replace(/_/g, " ")}
                </span>
              </div>
              <div className="text-sm">
                <strong>Priority:</strong> {viewing.priority}
              </div>
              <div className="text-sm">
                <strong>Reporter:</strong>{" "}
                {userNames[viewing.reporter_id] ?? viewing.reporter_id}
              </div>
              <div className="text-sm">
                <strong>Reported User:</strong>{" "}
                {userNames[viewing.reported_user_id] ??
                  viewing.reported_user_id}
              </div>
              <div className="text-sm whitespace-pre-wrap">
                <strong>Details:</strong>
                {"\n"}
                {viewing.details || "—"}
              </div>

              {/* Photo evidence */}
              {viewing.evidence_urls.filter((u) => !u.startsWith("msg:"))
                .length > 0 && (
                <div>
                  <strong className="text-sm">Photo Evidence:</strong>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {viewing.evidence_urls
                      .filter((u) => !u.startsWith("msg:"))
                      .map((u) => (
                        <a key={u} href={u} target="_blank" rel="noreferrer">
                          <img
                            src={u}
                            alt="Evidence"
                            className="rounded object-cover aspect-square w-full"
                          />
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {/* Message evidence */}
              {isMessageReport(viewing) && (
                <div>
                  <strong className="text-sm">Reported Message:</strong>
                  <div className="mt-1.5 rounded-lg bg-muted/60 border border-border/50 px-3.5 py-2.5 text-sm italic text-foreground/80">
                    "{extractReportedMessage(viewing) || "—"}"
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminConversations;
