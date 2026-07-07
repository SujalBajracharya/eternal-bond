import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Users, Activity, Heart, DollarSign } from "lucide-react";

type Growth = { date: string; count: number };
type Stats = {
  total_users: number;
  new_last_7d: number;
  completed_profiles: number;
  growth_30d: Growth[];
};

const AdminAnalytics = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    supabase.rpc("admin_stats_v2" as never).then(({ data }) => data && setStats(data as unknown as Stats));
  }, []);

  const cards = [
    { label: "MAU (approx)", value: stats?.total_users ?? "—", icon: Users },
    { label: "New (7d) — proxy DAU", value: stats?.new_last_7d ?? "—", icon: Activity },
    { label: "Match rate", value: "—", icon: Heart },
    { label: "ARPU", value: "—", icon: DollarSign },
  ];

  return (
    <AdminLayout title="Analytics Center">
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
        <CardHeader><CardTitle>Signups (last 30 days)</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.growth_30d ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Retention, match-rate and revenue analytics will populate as those data sources come online.
      </p>
    </AdminLayout>
  );
};

export default AdminAnalytics;
