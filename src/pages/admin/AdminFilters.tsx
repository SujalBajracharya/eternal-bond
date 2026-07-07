import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-audit";

type Row = { id: string; key: string; label: string; tier: "free" | "premium" | "disabled" };

const AdminFilters = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase.from("filter_config").select("*").order("label");
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, tier: Row["tier"]) => {
    const { error } = await supabase.from("filter_config").update({ tier: tier as never }).eq("id", id);
    if (error) return toast.error(error.message);
    await logAdminAction("filter_tier_changed", "filter_config", id, { tier });
    toast.success("Updated");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, tier } : r)));
  };

  if (loading) return <AdminLayout title="Filters"><div className="p-12 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div></AdminLayout>;

  return (
    <AdminLayout title="Filter Management">
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.key}</div>
              </div>
              <Select value={r.tier} onValueChange={(v) => update(r.id, v as Row["tier"])}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminFilters;
