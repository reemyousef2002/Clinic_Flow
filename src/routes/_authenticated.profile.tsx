import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { initials, fmtDate } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — ClinicFlow" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  if (!user) return null;

  return (
    <div>
      <PageHeader title="My profile" description="Manage your personal information." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <Avatar className="mx-auto h-24 w-24"><AvatarFallback className="bg-primary/10 text-2xl text-primary">{initials(user.name)}</AvatarFallback></Avatar>
            <div className="mt-4 text-lg font-semibold">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <Badge className="mt-3 capitalize">{user.role}</Badge>
            <div className="mt-4 text-xs text-muted-foreground">Member since {fmtDate(user.createdAt)}</div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label className="mb-1.5 block text-xs">Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label className="mb-1.5 block text-xs">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label className="mb-1.5 block text-xs">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><Label className="mb-1.5 block text-xs">Role</Label><Input value={user.role} disabled className="capitalize" /></div>
            </div>
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try { await updateProfile({ name, email, phone }); toast.success("Profile updated"); }
                catch (e) { toast.error((e as Error).message); }
                finally { setSaving(false); }
              }}
            >
              Save changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
