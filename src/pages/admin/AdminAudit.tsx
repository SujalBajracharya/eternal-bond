import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
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

type Log = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const AdminAudit = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs((data as Log[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <AdminLayout title="Audit Logs">
      <div className="border rounded-lg bg-card overflow-x-auto">
        {loading ? (
          <div className="p-12 grid place-items-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Meta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {l.admin_id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{l.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {l.target_type && (
                      <span className="text-muted-foreground">
                        {l.target_type}:{" "}
                      </span>
                    )}
                    <span className="font-mono">
                      {l.target_id?.slice(0, 8) ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono max-w-[300px] truncate">
                    {Object.keys(l.metadata ?? {}).length
                      ? JSON.stringify(l.metadata)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-10"
                  >
                    No audit entries yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAudit;
