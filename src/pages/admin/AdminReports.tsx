import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, Check, X, Eye } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-audit";

type Row = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "dismissed";
  details: string | null;
  evidence_urls: string[];
  created_at: string;
};

const priorityColor: Record<string, string> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const AdminReports = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Row["status"]>("open");
  const [viewing, setViewing] = useState<Row | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("user_reports")
      .select("*")
      .eq("status", tab as never)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const reports = (data as Row[]) ?? [];
    setRows(reports);

    // Get unique user IDs
    const ids = [
      ...new Set(reports.flatMap((r) => [r.reporter_id, r.reported_user_id])),
    ];

    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      const map: Record<string, string> = {};

      profiles?.forEach((profile) => {
        map[profile.id] = profile.full_name ?? "Unknown User";
      });

      setUserNames(map);
    }

    setLoading(false);
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [tab]);

  const setStatus = async (id: string, status: Row["status"]) => {
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
    load();
  };

  const actOnUser = async (
    userId: string,
    action: "suspend" | "ban" | "warn",
    reportId: string,
  ) => {
    if (action === "warn") {
      await logAdminAction("user_warned", "profile", userId, {
        report_id: reportId,
      });
      toast.success("Warning issued");
      return;
    }
    const status = action === "suspend" ? "suspended" : "banned";
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: status as never })
      .eq("id", userId);
    if (error) return toast.error(error.message);
    await logAdminAction(`account_${status}`, "profile", userId, {
      report_id: reportId,
    });
    toast.success(`User ${status}`);
  };

  return (
    <AdminLayout title="Reports & Safety">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Row["status"])}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="p-12 grid place-items-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          No {tab} reports.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-medium capitalize">
                      {r.reason.replace("_", " ")}
                    </span>
                  </div>
                  <Badge variant={priorityColor[r.priority] as never}>
                    {r.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {r.details || "No details provided."}
                </p>
                <div className="text-xs text-muted-foreground">
                  Reported user id:{" "}
                  <span className="font-mono">
                    {r.reported_user_id.slice(0, 8)}…
                  </span>
                </div>
                Reported user:
                <span className="font-medium">
                  {userNames[r.reported_user_id] ?? "Unknown User"}
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewing(r)}
                  >
                    <Eye className="w-4 h-4" /> View
                  </Button>
                  {tab === "open" && (
                    <Button
                      size="sm"
                      onClick={() => setStatus(r.id, "investigating")}
                    >
                      Investigate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => actOnUser(r.reported_user_id, "warn", r.id)}
                  >
                    Warn
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      actOnUser(r.reported_user_id, "suspend", r.id)
                    }
                  >
                    Suspend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => actOnUser(r.reported_user_id, "ban", r.id)}
                  >
                    Ban
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus(r.id, "resolved")}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus(r.id, "dismissed")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report evidence</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="text-sm">
                <strong>Reason:</strong> {viewing.reason}
              </div>
              <div className="text-sm">
                <strong>Priority:</strong> {viewing.priority}
              </div>
              <div className="text-sm">
                <strong>Reporter Id:</strong> {viewing.reporter_id}
              </div>
              <div className="text-sm">
                <strong>Reporter:</strong>{" "}
                {userNames[viewing.reporter_id] ?? viewing.reporter_id}
              </div>
              <div className="text-sm">
                <strong>Reported Id:</strong> {viewing.reported_user_id}
              </div>
              <div className="text-sm">
                <strong>Reported:</strong>{" "}
                {userNames[viewing.reported_user_id] ??
                  viewing.reported_user_id}
              </div>

              <div className="text-sm whitespace-pre-wrap">
                <strong>Details:</strong>
                {"\n"}
                {viewing.details || "—"}
              </div>
              {viewing.evidence_urls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {viewing.evidence_urls.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer">
                      <img
                        src={u}
                        alt="Evidence"
                        className="rounded object-cover aspect-square w-full"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReports;
