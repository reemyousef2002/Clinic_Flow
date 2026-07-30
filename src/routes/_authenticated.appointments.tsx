import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi, doctorsApi, patientsApi } from "@/lib/mock-api";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar as CalIcon, CheckCircle2, MoreHorizontal, Plus, X } from "lucide-react";
import { fmtDate, fmtDateTime, fmtTime } from "@/lib/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { Appointment, AppointmentStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({ meta: [{ title: "Appointments — ClinicFlow" }] }),
  component: AppointmentsPage,
});

const statusStyles: Record<AppointmentStatus, string> = {
  scheduled: "bg-info/15 text-info hover:bg-info/15",
  completed: "bg-success/15 text-success hover:bg-success/15",
  cancelled: "bg-destructive/15 text-destructive hover:bg-destructive/15",
  "no-show": "bg-muted text-muted-foreground",
};

function AppointmentsPage() {
  const qc = useQueryClient();
  const { data: appts, isLoading } = useQuery({ queryKey: ["appointments"], queryFn: appointmentsApi.list });
  const { data: patients } = useQuery({ queryKey: ["patients"], queryFn: patientsApi.list });
  const { data: doctors } = useQuery({ queryKey: ["doctors"], queryFn: doctorsApi.list });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = appts ?? [];
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [appts, statusFilter]);

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Appointment> }) => appointmentsApi.update(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); toast.success("Updated"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const del = useMutation({
    mutationFn: appointmentsApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); toast.success("Deleted"); },
  });

  const days = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of filtered.filter(a => a.status === "scheduled")) {
      const key = new Date(a.date).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime()).slice(0, 14);
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="Appointments"
        description={`${appts?.length ?? 0} appointments in the system`}
        actions={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> Book appointment</Button>}
      />

      <Tabs defaultValue="table">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="table">Table view</TabsTrigger>
            <TabsTrigger value="calendar"><CalIcon className="mr-1.5 h-3.5 w-3.5" /> Calendar</TabsTrigger>
          </TabsList>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No-show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-4">
              {isLoading ? <div className="h-96 animate-pulse rounded bg-muted" /> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Date & time</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.slice(0, 50).map((a) => {
                        const p = patients?.find((x) => x.id === a.patientId);
                        const d = doctors?.find((x) => x.id === a.doctorId);
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{p ? `${p.firstName} ${p.lastName}` : "—"}</TableCell>
                            <TableCell>{d ? `Dr. ${d.firstName} ${d.lastName}` : "—"}</TableCell>
                            <TableCell>{fmtDateTime(a.date)}</TableCell>
                            <TableCell>{a.reason}</TableCell>
                            <TableCell><Badge className={`capitalize ${statusStyles[a.status]}`}>{a.status}</Badge></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditing(a)}>Reschedule / Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => update.mutate({ id: a.id, patch: { status: "completed" } })}><CheckCircle2 className="mr-2 h-4 w-4" /> Mark completed</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => update.mutate({ id: a.id, patch: { status: "cancelled" } })}><X className="mr-2 h-4 w-4" /> Cancel</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(a.id)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {days.map(([day, list]) => (
              <Card key={day}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{fmtDate(day)}</div>
                      <div className="text-xs text-muted-foreground">{list.length} appointments</div>
                    </div>
                    <div className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {new Date(day).toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {list.slice(0, 6).map((a) => {
                      const p = patients?.find((x) => x.id === a.patientId);
                      return (
                        <li key={a.id} className="rounded-md border-l-2 border-primary bg-muted/40 px-2 py-1.5 text-xs">
                          <div className="font-medium">{fmtTime(a.date)} · {p ? `${p.firstName} ${p.lastName}` : "Patient"}</div>
                          <div className="text-muted-foreground">{a.reason}</div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AppointmentForm open={creating || !!editing} onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }} appt={editing ?? undefined} />
      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Delete appointment?" onConfirm={() => { if (confirmDel) { del.mutate(confirmDel); setConfirmDel(null); } }} />
    </div>
  );
}

function AppointmentForm({ open, onOpenChange, appt }: { open: boolean; onOpenChange: (v: boolean) => void; appt?: Appointment }) {
  const qc = useQueryClient();
  const { data: patients } = useQuery({ queryKey: ["patients"], queryFn: patientsApi.list });
  const { data: doctors } = useQuery({ queryKey: ["doctors"], queryFn: doctorsApi.list });
  const [form, setForm] = useState<Partial<Appointment>>({});
  useMemo(() => {
    setForm(appt ?? { patientId: "", doctorId: "", date: new Date().toISOString(), duration: 30, reason: "", status: "scheduled", notes: "" });
  }, [appt, open]);

  const save = useMutation({
    mutationFn: async () => appt ? appointmentsApi.update(appt.id, form as Appointment) : appointmentsApi.create(form as Omit<Appointment, "id" | "createdAt">),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); toast.success(appt ? "Updated" : "Appointment booked"); onOpenChange(false); },
    onError: (e) => toast.error((e as Error).message),
  });

  const set = (k: keyof Appointment, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const dateVal = form.date ? new Date(form.date).toISOString().slice(0, 16) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{appt ? "Edit appointment" : "Book appointment"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label className="mb-1.5 block text-xs">Patient</Label>
            <Select value={form.patientId ?? ""} onValueChange={(v) => set("patientId", v)}>
              <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
              <SelectContent>{patients?.slice(0, 60).map(p => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Doctor</Label>
            <Select value={form.doctorId ?? ""} onValueChange={(v) => set("doctorId", v)}>
              <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
              <SelectContent>{doctors?.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.specialty}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="mb-1.5 block text-xs">Date & time</Label><Input type="datetime-local" value={dateVal} onChange={(e) => set("date", new Date(e.target.value).toISOString())} /></div>
            <div><Label className="mb-1.5 block text-xs">Duration (min)</Label><Input type="number" value={form.duration ?? 30} onChange={(e) => set("duration", parseInt(e.target.value) || 30)} /></div>
          </div>
          <div><Label className="mb-1.5 block text-xs">Reason</Label><Input value={form.reason ?? ""} onChange={(e) => set("reason", e.target.value)} /></div>
          <div>
            <Label className="mb-1.5 block text-xs">Status</Label>
            <Select value={form.status ?? "scheduled"} onValueChange={(v) => set("status", v as AppointmentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No-show</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="mb-1.5 block text-xs">Notes</Label><Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
