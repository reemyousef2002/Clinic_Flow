import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorsApi } from "@/lib/mock-api";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Mail, Phone, Pencil, Plus, Search, Stethoscope, Trash2 } from "lucide-react";
import { initials } from "@/lib/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import type { Doctor } from "@/types";

export const Route = createFileRoute("/_authenticated/doctors")({
  head: () => ({ meta: [{ title: "Doctors — ClinicFlow" }] }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const qc = useQueryClient();
  const { data: doctors, isLoading } = useQuery({ queryKey: ["doctors"], queryFn: doctorsApi.list });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = doctors ?? [];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((d) => `${d.firstName} ${d.lastName} ${d.department} ${d.specialty}`.toLowerCase().includes(s));
    }
    return list;
  }, [doctors, q]);

  const del = useMutation({
    mutationFn: doctorsApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["doctors"] }); toast.success("Doctor deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <PageHeader
        title="Doctors"
        description={`${doctors?.length ?? 0} on staff`}
        actions={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New doctor</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search doctor, department, specialty..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Card key={i}><CardContent className="p-6"><div className="h-32 animate-pulse rounded-lg bg-muted" /></CardContent></Card>)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors" description="Add your first doctor to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">{initials(`${d.firstName} ${d.lastName}`)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Dr. {d.firstName} {d.lastName}</div>
                      <div className="text-xs text-muted-foreground">{d.specialty}</div>
                    </div>
                  </div>
                  <Badge variant={d.available ? "default" : "outline"} className={d.available ? "bg-success/15 text-success hover:bg-success/15" : ""}>
                    {d.available ? "Available" : "Off"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2"><Badge variant="secondary">{d.department}</Badge></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {d.email}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {d.phone}</div>
                  <div className="text-xs text-muted-foreground">Hours: {d.workingHours.start} – {d.workingHours.end}</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1"><Link to="/doctors/$id" params={{ id: d.id }}><Eye className="mr-1.5 h-3.5 w-3.5" /> View</Link></Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDel(d.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DoctorForm open={creating || !!editing} onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }} doctor={editing ?? undefined} />
      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Delete doctor?" onConfirm={() => { if (confirmDel) { del.mutate(confirmDel); setConfirmDel(null); } }} />
    </div>
  );
}

function DoctorForm({ open, onOpenChange, doctor }: { open: boolean; onOpenChange: (v: boolean) => void; doctor?: Doctor }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Doctor>>({});
  useMemo(() => {
    setForm(doctor ?? { firstName: "", lastName: "", email: "", phone: "", department: "General Medicine", specialty: "", available: true, workingHours: { start: "09:00", end: "17:00", days: ["Mon","Tue","Wed","Thu","Fri"] }, bio: "" });
  }, [doctor, open]);
  const save = useMutation({
    mutationFn: async () => doctor ? doctorsApi.update(doctor.id, form as Doctor) : doctorsApi.create(form as Omit<Doctor, "id" | "createdAt">),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["doctors"] }); toast.success(doctor ? "Doctor updated" : "Doctor created"); onOpenChange(false); },
    onError: (e) => toast.error((e as Error).message),
  });
  const set = (k: keyof Doctor, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{doctor ? "Edit doctor" : "New doctor"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label className="mb-1.5 block text-xs">First name</Label><Input value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Last name</Label><Input value={form.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Phone</Label><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Department</Label><Input value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Specialty</Label><Input value={form.specialty ?? ""} onChange={(e) => set("specialty", e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Start</Label><Input type="time" value={form.workingHours?.start ?? "09:00"} onChange={(e) => set("workingHours", { ...form.workingHours!, start: e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-xs">End</Label><Input type="time" value={form.workingHours?.end ?? "17:00"} onChange={(e) => set("workingHours", { ...form.workingHours!, end: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label className="mb-1.5 block text-xs">Bio</Label><Textarea value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} /></div>
          <div className="flex items-center gap-2 sm:col-span-2"><Switch checked={!!form.available} onCheckedChange={(v) => set("available", v)} /> <Label className="text-sm">Available for appointments</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
