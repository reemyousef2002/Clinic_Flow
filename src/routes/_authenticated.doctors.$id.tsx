import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { doctorsApi, appointmentsApi, patientsApi } from "@/lib/mock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Clock, Calendar } from "lucide-react";
import { fmtDateTime, initials } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/doctors/$id")({
  head: () => ({ meta: [{ title: "Doctor details — ClinicFlow" }] }),
  component: DoctorDetailsPage,
});

function DoctorDetailsPage() {
  const { id } = useParams({ from: "/_authenticated/doctors/$id" });
  const { data: doctor, isLoading } = useQuery({ queryKey: ["doctor", id], queryFn: () => doctorsApi.get(id) });
  const { data: appts } = useQuery({ queryKey: ["appointments"], queryFn: appointmentsApi.list });
  const { data: patients } = useQuery({ queryKey: ["patients"], queryFn: patientsApi.list });

  if (isLoading || !doctor) return <Skeleton className="h-96 w-full" />;
  const schedule = (appts ?? []).filter((a) => a.doctorId === id).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10);

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4"><Link to="/doctors"><ArrowLeft className="mr-2 h-4 w-4" /> Back to doctors</Link></Button>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <Avatar className="mx-auto h-24 w-24"><AvatarFallback className="bg-primary/10 text-2xl text-primary">{initials(`${doctor.firstName} ${doctor.lastName}`)}</AvatarFallback></Avatar>
            <div className="mt-4 text-xl font-semibold">Dr. {doctor.firstName} {doctor.lastName}</div>
            <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
            <div className="mt-3"><Badge variant="secondary">{doctor.department}</Badge></div>
            <Badge className={`mt-2 ${doctor.available ? "bg-success/15 text-success hover:bg-success/15" : "bg-muted"}`}>{doctor.available ? "Available" : "Unavailable"}</Badge>
            <div className="mt-6 space-y-3 text-left text-sm">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {doctor.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {doctor.phone}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {doctor.workingHours.start} – {doctor.workingHours.end}</div>
              <div className="text-xs text-muted-foreground">Working days: {doctor.workingHours.days.join(", ")}</div>
            </div>
            {doctor.bio && <p className="mt-4 text-left text-sm text-muted-foreground">{doctor.bio}</p>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Schedule</CardTitle></CardHeader>
          <CardContent>
            {schedule.length === 0 ? <p className="text-sm text-muted-foreground">No appointments</p> : (
              <div className="divide-y">
                {schedule.map((a) => {
                  const p = patients?.find((x) => x.id === a.patientId);
                  return (
                    <div key={a.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <div className="font-medium">{p ? `${p.firstName} ${p.lastName}` : "Patient"}</div>
                        <div className="text-xs text-muted-foreground">{a.reason}</div>
                      </div>
                      <div className="text-right">
                        <div>{fmtDateTime(a.date)}</div>
                        <Badge variant="outline" className="mt-1 capitalize">{a.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
