import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patientsApi } from "@/lib/mock-api";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { age, fmtDate, initials } from "@/lib/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TableSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import type { BloodType, Gender, Patient } from "@/types";

export const Route = createFileRoute("/_authenticated/patients")({
  head: () => ({ meta: [{ title: "Patients — ClinicFlow" }] }),
  component: PatientsPage,
});

type SortKey = "name" | "createdAt" | "age";

function PatientsPage() {
  const qc = useQueryClient();
  const { data: patients, isLoading } = useQuery({ queryKey: ["patients"], queryFn: patientsApi.list });
  const [q, setQ] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [editing, setEditing] = useState<Patient | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = patients ?? [];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((p) =>
        `${p.firstName} ${p.lastName} ${p.email} ${p.phone}`.toLowerCase().includes(s),
      );
    }
    if (genderFilter !== "all") list = list.filter((p) => p.gender === genderFilter);
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) * dir;
      if (sortKey === "age") return (age(b.dob) - age(a.dob)) * -dir;
      return (a.createdAt < b.createdAt ? -1 : 1) * dir;
    });
    return list;
  }, [patients, q, genderFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const del = useMutation({
    mutationFn: patientsApi.remove,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["patients"] });
      const prev = qc.getQueryData<Patient[]>(["patients"]);
      qc.setQueryData<Patient[]>(["patients"], (old) => old?.filter((p) => p.id !== id) ?? []);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["patients"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Patient deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }

  return (
    <div>
      <PageHeader
        title="Patients"
        description={`${patients?.length ?? 0} patients registered`}
        actions={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New patient</Button>}
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name, email, phone..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={genderFilter} onValueChange={(v) => { setGenderFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : paged.length === 0 ? (
            <EmptyState icon={Users} title="No patients found" description="Try adjusting your search or add a new patient." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>
                        <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                          Patient <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>
                        <button className="flex items-center gap-1" onClick={() => toggleSort("age")}>Age <ArrowUpDown className="h-3 w-3" /></button>
                      </TableHead>
                      <TableHead>Blood</TableHead>
                      <TableHead>Allergies</TableHead>
                      <TableHead>
                        <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>Registered <ArrowUpDown className="h-3 w-3" /></button>
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.patientCode}</TableCell>
                        <TableCell>
                          <Link to="/patients/$id" params={{ id: p.id }} className="flex items-center gap-3 hover:text-primary">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(`${p.firstName} ${p.lastName}`)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{p.firstName} {p.lastName}</div>
                              <div className="text-xs capitalize text-muted-foreground">{p.gender}</div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{p.email}</div>
                          <div className="text-xs text-muted-foreground">{p.phone}</div>
                        </TableCell>
                        <TableCell>{age(p.dob)}</TableCell>
                        <TableCell><Badge variant="secondary">{p.bloodType}</Badge></TableCell>
                        <TableCell>
                          {p.allergies.length ? (
                            <div className="flex flex-wrap gap-1">
                              {p.allergies.slice(0, 2).map((a) => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
                              {p.allergies.length > 2 && <span className="text-xs text-muted-foreground">+{p.allergies.length - 2}</span>}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">None</span>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(p.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild><Link to="/patients/$id" params={{ id: p.id }}><Eye className="mr-2 h-4 w-4" /> View</Link></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditing(p)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(p.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Page {page} of {totalPages} · {filtered.length} results</div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PatientForm open={creating || !!editing} onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }} patient={editing ?? undefined} />
      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Delete patient?" description="This permanently removes the patient record." confirmLabel="Delete" onConfirm={() => { if (confirmDel) { del.mutate(confirmDel); setConfirmDel(null); } }} />
    </div>
  );
}

function PatientForm({ open, onOpenChange, patient }: { open: boolean; onOpenChange: (v: boolean) => void; patient?: Patient }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Patient>>({});
  useMemo(() => {
    setForm(patient ?? { firstName: "", lastName: "", email: "", phone: "", gender: "male", dob: new Date(1990, 0, 1).toISOString(), bloodType: "O+", allergies: [], address: "", emergencyContactName: "", emergencyContactPhone: "", medicalHistory: [] });
  }, [patient, open]);

  const save = useMutation({
    mutationFn: async () => {
      if (patient) return patientsApi.update(patient.id, form as Patient);
      return patientsApi.create(form as Omit<Patient, "id" | "createdAt">);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success(patient ? "Patient updated" : "Patient created");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const set = (k: keyof Patient, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{patient ? "Edit patient" : "New patient"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><Input value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} /></Field>
          <Field label="Last name"><Input value={form.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Date of birth"><Input type="date" value={form.dob ? new Date(form.dob).toISOString().slice(0, 10) : ""} onChange={(e) => set("dob", new Date(e.target.value).toISOString())} /></Field>
          <Field label="Gender">
            <Select value={form.gender ?? "male"} onValueChange={(v) => set("gender", v as Gender)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Blood type">
            <Select value={form.bloodType ?? "O+"} onValueChange={(v) => set("bloodType", v as BloodType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Allergies (comma separated)">
            <Input value={(form.allergies ?? []).join(", ")} onChange={(e) => set("allergies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </Field>
          <Field label="Address" className="sm:col-span-2"><Textarea value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Emergency contact name"><Input value={form.emergencyContactName ?? ""} onChange={(e) => set("emergencyContactName", e.target.value)} /></Field>
          <Field label="Emergency contact phone"><Input value={form.emergencyContactPhone ?? ""} onChange={(e) => set("emergencyContactPhone", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}
