import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Conversation monitoring is restricted to reported cases only.
 * Lists open/investigating reports with a placeholder for chat history
 * (real chat storage is not exposed to this admin yet).
 */
type Report = {
  id: string;
  reported_user_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
};

const AdminConversations = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("user_reports")
      .select("id, reported_user_id, reporter_id, reason, created_at")
      .in("status", ["open", "investigating"] as never)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setReports((data as Report[]) ?? []); setLoading(false); });
  }, []);

  return (
    <AdminLayout title="Conversation Monitoring">
      <p className="text-sm text-muted-foreground mb-4">
        Chat access is only unlocked for reported cases. Select a report to view the associated conversation.
      </p>
      {loading ? (
        <div className="p-12 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <MessageSquare className="w-5 h-5 text-primary" />
                <CardTitle className="text-base capitalize">{r.reason.replace("_", " ")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Report #{r.id.slice(0, 8)} · Reporter {r.reporter_id.slice(0, 8)} → User {r.reported_user_id.slice(0, 8)}
                <div className="mt-3 text-xs italic">Chat history is not yet wired to this project. Once messages are stored, they will render here for safety review.</div>
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No conversations awaiting review.</div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminConversations;
