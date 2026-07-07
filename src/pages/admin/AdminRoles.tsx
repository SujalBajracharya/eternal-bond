import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ShieldCheck, ShieldOff, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  roles: string[];
};

const AdminRoles = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users" as never);
    if (error) toast.error(error.message);
    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      await load();
    };
    init();
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

  const grantAdmin = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Admin access granted");
      await load();
    }
    setActionLoading(null);
  };

  const revokeAdmin = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin" as never);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Admin access removed");
      await load();
    }
    setActionLoading(null);
  };

  const adminCount = rows.filter((r) => r.roles.includes("admin")).length;

  return (
    <AdminLayout title="Admin Access">
      {/* Header summary */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="font-medium">{adminCount}</span>
          <span className="text-muted-foreground">
            admin{adminCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{rows.length}</span>
          <span className="text-muted-foreground">total users</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        {loading ? (
          <div className="p-12 grid place-items-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {q ? "No users match your search." : "No users found."}
          </div>
        ) : (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const isAdmin = r.roles.includes("admin");
                  const isSelf = r.id === currentUserId;
                  const isActing = actionLoading === r.id;

                  return (
                    <TableRow key={r.id}>
                      {/* User */}
                      <TableCell>
                        <div className="font-medium leading-snug">
                          {r.full_name || (
                            <span className="text-muted-foreground italic">
                              Unnamed
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.email}
                        </div>
                      </TableCell>

                      {/* Status badge */}
                      <TableCell>
                        {isAdmin ? (
                          <Badge className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="gap-1.5 text-muted-foreground"
                          >
                            <Users className="w-3 h-3" />
                            User
                          </Badge>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        {isAdmin ? (
                          isSelf ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="gap-1.5 opacity-50 cursor-not-allowed"
                                  >
                                    <ShieldOff className="w-3.5 h-3.5" />
                                    Remove Admin
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                You cannot remove your own admin access
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                              disabled={isActing}
                              onClick={() => revokeAdmin(r.id)}
                            >
                              {isActing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldOff className="w-3.5 h-3.5" />
                              )}
                              Remove Admin
                            </Button>
                          )
                        ) : (
                          <Button
                            size="sm"
                            className="gap-1.5"
                            disabled={isActing}
                            onClick={() => grantAdmin(r.id)}
                          >
                            {isActing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            Make Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRoles;
