import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicinesApi } from "@/lib/mock-api";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatCard } from "@/components/common/StatCard";
import { AlertTriangle, ArrowUpDown, MoreHorizontal, Pencil, Pill, Plus, Search, Trash2 } from "lucide-react";
import { currency, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { Medicine } from "@/types";

export const Route = createFileRoute("/_authenticated/medicines")({
  head: () => ({ meta: [{ title: "Medicine inventory — ClinicFlow" }] }),
  component: MedicinesPage,
});

function statusFor(m: Medicine): { label: string; className: string } {
  const now = Date.now();
  const exp = new Date(m.expiryDate).getTime();
  if (exp < now) return { label: "Expired", className: "bg-destructive/15 text-destructive" };
  const in30 = now + 30 * 24 * 60 * 60 * 1000;
  if (exp < in30) return { label: "Expiring soon", className: "bg-warning/15 text-warning" };
  if (m.quantity === 0) return { label: "Out of stock", className: "bg-destructive/15 text-destructive" };
  if (m.quantity <= m.reorderLevel) return { label: "Low stock", className: "bg-warning/15 text-warning" };
  return { label: "In stock", className: "bg-success/15 text-success" };
}

function MedicinesPage() {
  const qc = useQueryClient();
  const { data: meds, isLoading } = useQuery({ queryKey: ["medicines"], queryFn: medicinesApi.list });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"name" | "quantity" | "expiryDate">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set((meds ?? []).map((m) => m.category))).sort(), [meds]);

  const alerts = useMemo(() => {
    const list = meds ?? [];
    const now = Date.now();
    const in30 = now + 30 * 24 * 60 * 60 * 1000;
    return {
      expired: list.filter((m) => new Date(m.expiryDate).getTime() < now).length,
      expiring: list.filter((m) => { const t = new Date(m.expiryDate).getTime(); return t >= now && t <= in30; }).length,
      low: list.filter((m) => m.quantity <= m.reorderLevel && m.quantity > 0).length,
      out: list.filter((m) => m.quantity === 0).length,
    };
  }, [meds]);

  const filtered = useMemo(() => {
    let list = meds ?? [];
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.supplier.toLowerCase().includes(q.toLowerCase()));
    if (cat !== "all") list = list.filter((m) => m.category === cat);
    if (statusFilter !== "all") list = list.filter((m) => statusFor(m).label === statusFilter);
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      if (sortKey === "quantity") return (a.quantity - b.quantity) * dir;
      return (new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()) * dir;
    });
    return list;
  }, [meds, q, cat, statusFilter, sortKey, sortDir]);

  const del = useMutation({
    mutationFn: medicinesApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["medicines"] }); toast.success("Deleted"); },
  });

  function toggleSort(k: typeof sortKey) {
    if (sortKey === k) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  }

  return (
    <div>
      <PageHeader
        title="Medicine Inventory"
        description={`${meds?.length ?? 0} items in stock`}
        actions={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New medicine</Button>}
      />

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <StatCard label="Expired" value={alerts.expired} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Expiring soon" value={alerts.expiring} icon={AlertTriangle} tone="warning" />
        <StatCard label="Low stock" value={alerts.low} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of stock" value={alerts.out} icon={Pill} tone="destructive" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or supplier..." className="pl-9" /></div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="In stock">In stock</SelectItem>
                <SelectItem value="Low stock">Low stock</SelectItem>
                <SelectItem value="Out of stock">Out of stock</SelectItem>
                <SelectItem value="Expiring soon">Expiring soon</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? <div className="h-96 animate-pulse rounded bg-muted" /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead><button className="flex items-center gap-1" onClick={() => toggleSort("name")}>Name <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead><button className="flex items-center gap-1" onClick={() => toggleSort("quantity")}>Qty <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead><button className="flex items-center gap-1" onClick={() => toggleSort("expiryDate")}>Expiry <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 60).map((m) => {
                    const s = statusFor(m);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{m.code}</TableCell>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell><Badge variant="outline">{m.category}</Badge></TableCell>
                        <TableCell>{m.quantity}</TableCell>
                        <TableCell>{currency(m.price)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.supplier}</TableCell>
                        <TableCell className="text-sm">{fmtDate(m.expiryDate)}</TableCell>
                        <TableCell><Badge className={s.className}>{s.label}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditing(m)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(m.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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

      <MedicineForm open={creating || !!editing} onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }} medicine={editing ?? undefined} />
      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Delete medicine?" onConfirm={() => { if (confirmDel) { del.mutate(confirmDel); setConfirmDel(null); } }} />
    </div>
  );
}

function MedicineForm({ open, onOpenChange, medicine }: { open: boolean; onOpenChange: (v: boolean) => void; medicine?: Medicine }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Medicine>>({});
  useMemo(() => {
    setForm(medicine ?? { name: "", category: "Antibiotic", quantity: 0, price: 0, supplier: "", expiryDate: new Date(Date.now() + 365 * 86400 * 1000).toISOString(), reorderLevel: 30 });
  }, [medicine, open]);
  const save = useMutation({
    mutationFn: async () => medicine ? medicinesApi.update(medicine.id, form as Medicine) : medicinesApi.create(form as Omit<Medicine, "id" | "createdAt">),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["medicines"] }); toast.success("Saved"); onOpenChange(false); },
    onError: (e) => toast.error((e as Error).message),
  });
  const set = (k: keyof Medicine, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{medicine ? "Edit medicine" : "New medicine"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label className="mb-1.5 block text-xs">Name</Label><Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Category</Label><Input value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Supplier</Label><Input value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Quantity</Label><Input type="number" value={form.quantity ?? 0} onChange={(e) => set("quantity", parseInt(e.target.value) || 0)} /></div>
          <div><Label className="mb-1.5 block text-xs">Price</Label><Input type="number" step="0.01" value={form.price ?? 0} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} /></div>
          <div><Label className="mb-1.5 block text-xs">Reorder level</Label><Input type="number" value={form.reorderLevel ?? 30} onChange={(e) => set("reorderLevel", parseInt(e.target.value) || 0)} /></div>
          <div><Label className="mb-1.5 block text-xs">Expiry date</Label><Input type="date" value={form.expiryDate ? new Date(form.expiryDate).toISOString().slice(0, 10) : ""} onChange={(e) => set("expiryDate", new Date(e.target.value).toISOString())} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
