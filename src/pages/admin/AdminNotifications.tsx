import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { logAdminAction } from "@/lib/admin-audit";

type Row = { id: string; title: string; body: string; audience: string; sent_at: string };

const AUDIENCES = ["all", "premium", "female", "male", "new"];

const AdminNotifications = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("announcements").select("*").order("sent_at", { ascending: false }).limit(30);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!title.trim() || !body.trim() || !user) return toast.error("Title and body required");
    setSending(true);
    const { error } = await supabase.from("announcements").insert({
      title: title.trim(), body: body.trim(), audience, sent_by: user.id,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    await logAdminAction("announcement_sent", "announcement", null as never, { audience });
    toast.success("Announcement broadcast");
    setTitle(""); setBody("");
    load();
  };

  return (
    <AdminLayout title="Push Notifications">
      <Card className="mb-6">
        <CardHeader><CardTitle>Broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea rows={4} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex gap-3">
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>{AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={send} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-2">Recent</h2>
      {loading ? (
        <div className="p-12 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-muted-foreground">{r.body}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary">{r.audience}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(r.sent_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {rows.length === 0 && <div className="p-12 text-center text-muted-foreground">No announcements yet.</div>}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNotifications;
