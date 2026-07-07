import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  BadgeCheck,
  ShieldCheck,
  Crown,
  Search,
  Plus,
  X,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-audit";

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  kyc_status: string;
  roles: string[];
};

/**
 * Badges are derived from existing signals:
 * - Verified badge  = kyc_status = 'verified'
 * - Premium badge   = role 'premium' (repurposed as a manual grant)
 * Toggling these buttons updates the underlying kyc_status / user_roles rows.
 */
const AdminBadges = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users" as never);
    if (error) toast.error(error.message);
    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(s)),
    );
  }, [rows, q]);

  const toggleVerified = async (r: Row) => {
    const next = r.kyc_status === "verified" ? "unverified" : "verified";
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: next as never })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    await logAdminAction(`badge_verified_${next}`, "profile", r.id);
    load();
  };

  const toggleRole = async (r: Row, role: "moderator" | "premium") => {
    const has = r.roles.includes(role);
    if (has) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", r.id)
        .eq("role", role as never);
      if (error) return toast.error(error.message);
      await logAdminAction(`badge_${role}_removed`, "profile", r.id);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: r.id, role: role as never });
      if (error) return toast.error(error.message);
      await logAdminAction(`badge_${role}_granted`, "profile", r.id);
    }
    load();
  };

  return (
    <AdminLayout title="Badge Management">
      <div className="mb-4 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search users"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="border rounded-lg bg-card">
        {loading ? (
          <div className="p-12 grid place-items-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current badges</TableHead>
                <TableHead className="text-right">Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const verified = r.kyc_status === "verified";
                const premium = r.roles.includes("premium");
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {verified && (
                          <Badge className="gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                        {premium && (
                          <Badge className="gap-1 bg-amber-500 hover:bg-amber-500">
                            <Crown className="w-3 h-3" />
                            Premium
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant={verified ? "secondary" : "outline"}
                          onClick={() => toggleVerified(r)}
                        >
                          {verified ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}{" "}
                          Verified
                        </Button>
                        <Button
                          size="sm"
                          variant={premium ? "secondary" : "outline"}
                          onClick={() => toggleRole(r, "premium")}
                        >
                          {premium ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}{" "}
                          Premium
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBadges;
