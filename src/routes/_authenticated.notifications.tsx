import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/mock-api";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { relTime } from "@/lib/format";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — ClinicFlow" }] }),
  component: NotificationsPage,
});

const iconFor = { info: Info, warning: AlertTriangle, success: CheckCircle2, error: XCircle } as const;
const toneFor = { info: "text-info", warning: "text-warning", success: "text-success", error: "text-destructive" } as const;

function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifs, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list });
  const markAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); toast.success("All marked as read"); } });
  const markOne = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
  const remove = useMutation({ mutationFn: notificationsApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay on top of activity across your clinic."
        actions={<Button variant="outline" onClick={() => markAll.mutate()}><CheckCheck className="mr-2 h-4 w-4" /> Mark all read</Button>}
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="h-64 animate-pulse bg-muted" /> : (notifs?.length ?? 0) === 0 ? (
            <EmptyState icon={Bell} title="Nothing yet" description="You'll see updates about patients, appointments and inventory here." />
          ) : (
            <ul className="divide-y">
              {notifs!.map((n) => {
                const Icon = iconFor[n.type];
                return (
                  <li key={n.id} className={`flex items-start gap-3 p-4 ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className={`mt-0.5 ${toneFor[n.type]}`}><Icon className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{n.title}</div>
                        {!n.read && <Badge className="bg-primary/15 text-primary hover:bg-primary/15">New</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                      <div className="mt-1 text-xs text-muted-foreground">{relTime(n.createdAt)}</div>
                    </div>
                    <div className="flex gap-1">
                      {!n.read && <Button size="sm" variant="ghost" onClick={() => markOne.mutate(n.id)}>Mark read</Button>}
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(n.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
