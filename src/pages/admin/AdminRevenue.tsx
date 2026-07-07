import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Crown, Star } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

/**
 * Revenue overview. Real subscription/purchase tables are not present yet, so
 * this shows structure + placeholder chart. Wire it to a `purchases` table
 * when payments launch.
 */
const AdminRevenue = () => {
  const cards = [
    { label: "Revenue today", value: "—", icon: DollarSign },
    { label: "Revenue this month", value: "—", icon: TrendingUp },
    { label: "Premium subscribers", value: "—", icon: Crown },
    { label: "Top feature", value: "—", icon: Star },
  ];
  const data = Array.from({ length: 14 }, (_, i) => ({ day: `D${i + 1}`, revenue: 0 }));

  return (
    <AdminLayout title="Premium & Revenue">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-muted text-primary"><c.icon className="w-6 h-6" /></div>
              <div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
                <div className="text-2xl font-semibold">{c.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Revenue (last 14 days)</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <p className="mt-4 text-xs text-muted-foreground">
        Connect a purchases/subscriptions data source to populate these metrics automatically.
      </p>
    </AdminLayout>
  );
};

export default AdminRevenue;
