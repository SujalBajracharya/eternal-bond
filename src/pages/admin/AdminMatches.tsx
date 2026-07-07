import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

/**
 * Match Management: scaffolded. This project doesn't yet have a `matches`
 * table exposed to admin. When one is added (pair, status, created_at, expires_at)
 * this page will populate the metrics automatically.
 */
const AdminMatches = () => {
  const cards = [
    { label: "Total matches", value: "—" },
    { label: "Active matches", value: "—" },
    { label: "Expired matches", value: "—" },
    { label: "Unmatched pairs", value: "—" },
  ];
  return (
    <AdminLayout title="Match Management">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-muted text-primary"><Heart className="w-6 h-6" /></div>
              <div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
                <div className="text-3xl font-semibold">{c.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Match activity</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">
          No match records available yet. Once matches are stored in the database, force-unmatch, restore, and abuse investigation actions will appear here.
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminMatches;
