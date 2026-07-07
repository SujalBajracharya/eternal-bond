import { useEffect, useState } from "react";
import {
  Users,
  CheckCircle2,
  ShieldCheck,
  Clock,
  UserCog,
  TrendingUp,
  AlertTriangle,
  Ban,
  ImageIcon,
  Flag,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Growth = { date: string; count: number };
type Stats = {
  total_users: number;
  completed_profiles: number;
  kyc_pending: number;
  kyc_verified: number;
  admins: number;
  new_last_7d: number;
  suspended: number;
  banned: number;
  open_reports: number;
  critical_reports: number;
  photo_pending: number;
  male_count: number;
  female_count: number;
  growth_30d: Growth[];
};

const GENDER_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(145 100% 48%)",
];

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    supabase.rpc("admin_stats_v2" as never).then(({ data }) => {
      if (data) setStats(data as unknown as Stats);
    });
  }, []);

  const cards = [
    { label: "Total users", value: stats?.total_users ?? "—", icon: Users },
    {
      label: "Completed profiles",
      value: stats?.completed_profiles ?? "—",
      icon: CheckCircle2,
    },
    {
      label: "KYC verified",
      value: stats?.kyc_verified ?? "—",
      icon: ShieldCheck,
    },
    { label: "KYC pending", value: stats?.kyc_pending ?? "—", icon: Clock },
    { label: "New (7d)", value: stats?.new_last_7d ?? "—", icon: TrendingUp },
    { label: "Admins", value: stats?.admins ?? "—", icon: UserCog },
    { label: "Suspended", value: stats?.suspended ?? "—", icon: AlertTriangle },
    { label: "Banned", value: stats?.banned ?? "—", icon: Ban },
    { label: "Open reports", value: stats?.open_reports ?? "—", icon: Flag },
    {
      label: "Critical reports",
      value: stats?.critical_reports ?? "—",
      icon: AlertTriangle,
    },
    {
      label: "Photos pending",
      value: stats?.photo_pending ?? "—",
      icon: ImageIcon,
    },
    {
      label: "Profile completion %",
      value:
        stats && stats.total_users
          ? `${Math.round((stats.completed_profiles / stats.total_users) * 100)}%`
          : "—",
      icon: CheckCircle2,
    },
  ];

  const growth = stats?.growth_30d ?? [];
  const genderData = stats
    ? [
        { name: "Female", value: stats.female_count },
        { name: "Male", value: stats.male_count },
        {
          name: "Other",
          value: Math.max(
            0,
            stats.total_users - stats.female_count - stats.male_count,
          ),
        },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted text-primary">
                <c.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="text-2xl font-semibold">{c.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User growth (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  fill="url(#g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender ratio</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                >
                  {genderData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={GENDER_COLORS[i % GENDER_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
