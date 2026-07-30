import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { patientsApi, appointmentsApi, doctorsApi } from "@/lib/mock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, ShieldAlert, User } from "lucide-react";
import { age, fmtDate, fmtDateTime, initials } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/patients/$id")({
  head: () => ({ meta: [{ title: "Patient details — ClinicFlow" }] }),
  component: PatientDetailsPage,
});

function PatientDetailsPage() {
  const { id } = useParams({ from: "/_authenticated/patients/$id" });
  const { data: patient, isLoading } = useQuery({ queryKey: ["patient", id], queryFn: () => patientsApi.get(id) });
  const { data: appts } = useQuery({ queryKey: ["appointments"], queryFn: appointmentsApi.list });
  const { data: doctors } = useQuery({ queryKey: ["doctors"], queryFn: doctorsApi.list });

  const history = (appts ?? []).filter((a) => a.patientId === id).sort((a, b) => (a.date < b.date ? 1 : -1));

  if (isLoading || !patient) return <Skeleton className="h-96 w-full" />;

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4"><Link to="/patients"><ArrowLeft className="mr-2 h-4 w-4" /> Back to patients</Link></Button>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <Avatar className="mx-auto h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-2xl text-primary">{initials(`${patient.firstName} ${patient.lastName}`)}</AvatarFallback>
            </Avatar>
            <div className="mt-4 text-xl font-semibold">{patient.firstName} {patient.lastName}</div>
            <div className="text-sm capitalize text-muted-foreground">{patient.gender} · {age(patient.dob)} years old</div>
            <div className="mt-3 flex justify-center gap-2">
              <Badge variant="secondary">Blood {patient.bloodType}</Badge>
              <Badge variant="outline">Patient</Badge>
            </div>
            <div className="mt-6 space-y-3 text-left text-sm">
              <Row icon={Mail}>{patient.email}</Row>
              <Row icon={Phone}>{patient.phone}</Row>
              <Row icon={Calendar}>Born {fmtDate(patient.dob)}</Row>
              <Row icon={MapPin}>{patient.address}</Row>
              <Row icon={User}>{patient.emergencyContactName} · {patient.emergencyContactPhone}</Row>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-warning" /> Allergies</CardTitle></CardHeader>
            <CardContent>
              {patient.allergies.length ? (
                <div className="flex flex-wrap gap-2">{patient.allergies.map((a) => <Badge key={a} variant="destructive">{a}</Badge>)}</div>
              ) : <p className="text-sm text-muted-foreground">No known allergies</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Medical History</CardTitle></CardHeader>
            <CardContent>
              {patient.medicalHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries yet</p>
              ) : (
                <ul className="space-y-3">
                  {patient.medicalHistory.map((h, i) => (
                    <li key={i} className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">{fmtDate(h.date)}</div>
                      <div className="mt-1 text-sm">{h.note}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Appointments</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments</p>
              ) : (
                <div className="divide-y">
                  {history.slice(0, 8).map((a) => {
                    const d = doctors?.find((x) => x.id === a.doctorId);
                    return (
                      <div key={a.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <div className="font-medium">{a.reason}</div>
                          <div className="text-xs text-muted-foreground">{d ? `Dr. ${d.firstName} ${d.lastName}` : "Doctor"}</div>
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
    </div>
  );
}

function Row({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-muted-foreground">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span className="text-foreground">{children}</span>
    </div>
  );
}
