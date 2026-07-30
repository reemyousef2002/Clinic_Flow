import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";


export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — ClinicFlow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [name, setName] = useState("Springfield Family Clinic");
  const [timezone, setTimezone] = useState("America/New_York");
  const [notifs, setNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div>
      <PageHeader title="Settings" description="Configure your clinic preferences." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Clinic profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="mb-1.5 block text-xs">Clinic name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div>
              <Label className="mb-1.5 block text-xs">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => toast.success("Saved")}>Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Enable email notifications" checked={notifs} onChange={setNotifs} />
            <Toggle label="Compact table density" checked={false} onChange={() => {}} />
            <Toggle label="Dark mode preview" checked={darkMode} onChange={(v) => { setDarkMode(v); document.documentElement.classList.toggle("dark", v); }} />
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
