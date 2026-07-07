import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-audit";

type Row = { id: string; key: string; title: string | null; content: string };

const AdminCms = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase.from("cms_content").select("*").order("key");
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (r: Row) => {
    const { error } = await supabase.from("cms_content")
      .update({ title: r.title, content: r.content }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await logAdminAction("cms_updated", "cms_content", r.id, { key: r.key });
    toast.success(`Saved ${r.key}`);
  };

  const update = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  if (loading) return <AdminLayout title="CMS"><div className="p-12 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div></AdminLayout>;

  return (
    <AdminLayout title="Content Management">
      <div className="grid gap-4">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{r.key}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={r.title ?? ""} placeholder="Title" onChange={(e) => update(r.id, { title: e.target.value })} />
              <Textarea rows={5} value={r.content} placeholder="Content (Markdown or plain text)" onChange={(e) => update(r.id, { content: e.target.value })} />
              <div className="flex justify-end">
                <Button size="sm" onClick={() => save(r)}><Save className="w-4 h-4" /> Save</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminCms;
