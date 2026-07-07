import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, ShieldCheck, ShieldX, Loader2, Ban, PauseCircle, PlayCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-audit";

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  kyc_status: string;
  profile_completed: boolean;
  created_at: string;
  account_status: "active" | "suspended" | "banned";
  last_active_at: string | null;
  roles: string[];
};

const statusVariant = (s: string) =>
  s === "active" ? "outline" : s === "suspended" ? "secondary" : "destructive";

const AdminUsers = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users" as never);
    if (error) toast.error(error.message);
    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.phone].filter(Boolean).some((v) => v!.toLowerCase().includes(s)),
    );
  }, [rows, q]);

  const setKyc = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase.from("profiles").update({ kyc_status: status as never }).eq("id", id);
    if (error) return toast.error(error.message);
    await logAdminAction(`kyc_${status}`, "profile", id);
    toast.success(`KYC ${status}`);
    load();
  };

  const setStatus = async (id: string, account_status: "active" | "suspended" | "banned") => {
    const { error } = await supabase.from("profiles").update({ account_status: account_status as never }).eq("id", id);
    if (error) return toast.error(error.message);
    await logAdminAction(`account_${account_status}`, "profile", id);
    toast.success(`Account ${account_status}`);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logAdminAction("profile_deleted", "profile", id);
    toast.success("Profile removed");
    setConfirmDelete(null);
    load();
  };

  return (
    <AdminLayout title="Users">
      <div className="mb-4 flex items-center gap-3 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <div className="border rounded-lg bg-card overflow-x-auto">
        {loading ? (
          <div className="p-12 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{r.email || "—"}</div>
                    {r.phone && <div className="text-xs">{r.phone}</div>}
                  </TableCell>
                  <TableCell><Badge variant={statusVariant(r.account_status)}>{r.account_status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.roles.length ? r.roles.map((role) => (
                        <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>{role}</Badge>
                      )) : <span className="text-xs text-muted-foreground">none</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.kyc_status === "verified" ? "default" : r.kyc_status === "pending" ? "secondary" : r.kyc_status === "rejected" ? "destructive" : "outline"}>
                      {r.kyc_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.profile_completed ? <Badge variant="outline" className="text-emerald-600">Complete</Badge> : <Badge variant="outline" className="text-muted-foreground">Incomplete</Badge>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button size="sm" variant="ghost" title="Verify KYC" onClick={() => setKyc(r.id, "verified")}><ShieldCheck className="w-4 h-4 text-emerald-600" /></Button>
                      <Button size="sm" variant="ghost" title="Reject KYC" onClick={() => setKyc(r.id, "rejected")}><ShieldX className="w-4 h-4 text-amber-600" /></Button>
                      {r.account_status !== "active" && (
                        <Button size="sm" variant="ghost" title="Reactivate" onClick={() => setStatus(r.id, "active")}><PlayCircle className="w-4 h-4 text-emerald-600" /></Button>
                      )}
                      {r.account_status !== "suspended" && (
                        <Button size="sm" variant="ghost" title="Suspend" onClick={() => setStatus(r.id, "suspended")}><PauseCircle className="w-4 h-4 text-amber-600" /></Button>
                      )}
                      {r.account_status !== "banned" && (
                        <Button size="sm" variant="ghost" title="Ban" onClick={() => setStatus(r.id, "banned")}><Ban className="w-4 h-4 text-destructive" /></Button>
                      )}
                      <Button size="sm" variant="ghost" title="Delete profile" onClick={() => setConfirmDelete(r)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No users found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes {confirmDelete?.full_name || "this user"}'s profile record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && remove(confirmDelete.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
