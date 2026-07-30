import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, patientsApi, doctorsApi } from "@/lib/mock-api";
import { StatCard } from "@/components/common/StatCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Calendar, Users, Stethoscope, Pill, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { fmtDateTime, initials, relTime } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ClinicFlow" }] }),
  component: DashboardPage,
});

const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
const oklchColors = ["#2ec5c1", "#2fbf7e", "#4d90d4", "#e0a94a"];

function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.stats });
  const { data: patients } = useQuery({ queryKey: ["patients"], queryFn: patientsApi.list });
  const { data: doctors } = useQuery({ queryKey: ["doctors"], queryFn: doctorsApi.list });

  return (
    <div>
      <PageHeader title="Dashboard" description="Everything that's happening in your clinic today." />

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today's Appointments" value={data.todayAppointments} icon={Calendar} tone="primary" trend="Compared to yesterday" />
          <StatCard label="Total Patients" value={data.totalPatients} icon={Users} tone="info" trend="+12 this month" />
          <StatCard label="Doctors" value={data.totalDoctors} icon={Stethoscope} tone="success" trend={`${doctors?.filter(d => d.available).length ?? 0} available now`} />
          <StatCard label="Medicines" value={data.totalMedicines} icon={Pill} tone="warning" trend={`${data.lowStock} low stock`} />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Patient Growth</CardTitle>
              <p className="text-sm text-muted-foreground">Last 6 months</p>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.patientGrowth ?? []}>
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={oklchColors[0]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={oklchColors[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="month" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                <Line type="monotone" dataKey="count" stroke={oklchColors[0]} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <p className="text-sm text-muted-foreground">By status</p>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.appointmentsByStatus ?? []} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {(data?.appointmentsByStatus ?? []).map((_, i) => (
                    <Cell key={i} fill={oklchColors[i % oklchColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <p className="text-sm text-muted-foreground">Next scheduled visits</p>
            </div>
            <Link to="/appointments" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {(data?.upcomingAppointments ?? []).map((a) => {
                const p = patients?.find((x) => x.id === a.patientId);
                const d = doctors?.find((x) => x.id === a.doctorId);
                return (
                  <div key={a.id} className="flex items-center gap-3 py-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(p ? `${p.firstName} ${p.lastName}` : "?")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p ? `${p.firstName} ${p.lastName}` : "Patient"}</div>
                      <div className="truncate text-xs text-muted-foreground">{a.reason} · {d ? `Dr. ${d.lastName}` : "Doctor"}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="font-medium text-foreground">{fmtDateTime(a.date)}</div>
                      <Badge variant="outline" className="mt-1">{a.duration}m</Badge>
                    </div>
                  </div>
                );
              })}
              {(data?.upcomingAppointments.length ?? 0) === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No upcoming appointments</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-warning" /> Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertRow label="Low stock medicines" count={data?.lowStock ?? 0} tone="warning" />
              <AlertRow label="Expiring within 30d" count={data?.expiringSoon ?? 0} tone="destructive" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-primary" /> Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(data?.activity ?? []).slice(0, 6).map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{a.message}</div>
                      <div className="text-xs text-muted-foreground">{relTime(a.time)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AlertRow({ label, count, tone }: { label: string; count: number; tone: "warning" | "destructive" }) {
  const toneCls = tone === "warning" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="text-sm">{label}</div>
      <span className={`rounded-md px-2 py-0.5 text-sm font-semibold ${toneCls}`}>{count}</span>
    </div>
  );
}
