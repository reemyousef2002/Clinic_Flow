import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/mock-api";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — ClinicFlow" }] }),
  component: ReportsPage,
});

const c1 = "#2ec5c1";
const c2 = "#2fbf7e";
const c3 = "#4d90d4";

function ReportsPage() {
  const { data } = useQuery({ queryKey: ["reports"], queryFn: reportsApi.summary });

  const exportCsv = (name: string, rows: Record<string, unknown>[]) => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(","), ...rows.map(r => cols.map(c => JSON.stringify(r[c] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Insights across your clinic operations."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard title="Appointments" description="Last 6 months" onExport={() => exportCsv("appointments", data?.appointmentsByMonth ?? [])}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.appointmentsByMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} />
              <Tooltip /><Bar dataKey="count" fill={c3} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>

        <ReportCard title="Patient Growth" description="Cumulative patients" onExport={() => exportCsv("patient_growth", data?.patientGrowth ?? [])}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.patientGrowth ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} />
              <Tooltip /><Line type="monotone" dataKey="count" stroke={c2} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ReportCard>

        <ReportCard
          title="Medicine stock by category"
          description="Total quantity"
          onExport={() => exportCsv("stock", data?.stockByCategory ?? [])}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.stockByCategory ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" fontSize={12} /><YAxis type="category" dataKey="category" width={110} fontSize={11} />
              <Tooltip /><Bar dataKey="qty" fill={c1} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      </div>
    </div>
  );
}

function ReportCard({ title, description, children, onExport, className }: { title: string; description: string; children: React.ReactNode; onExport: () => void; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExport}><Download className="mr-1.5 h-3.5 w-3.5" /> CSV</Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}