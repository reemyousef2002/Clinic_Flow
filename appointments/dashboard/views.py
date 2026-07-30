from datetime import date, time, timedelta

from django.utils import timezone

from django.db.models import Count
from django.db.models.functions import TruncMonth
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from appointments.models import Appointment
from doctors.models import Doctor
from medicines.models import Medicine
from notifications.models import Notification
from patients.models import Patient


class DashboardStatsView(APIView):
    """
    Single aggregate endpoint powering the Dashboard page — mirrors the
    frontend's DashboardStats type (todayAppointments, totalPatients, etc.)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        today_start = timezone.make_aware(timezone.datetime.combine(today, time.min))
        today_end = timezone.make_aware(timezone.datetime.combine(today, time.max))

        medicines = Medicine.objects.all()
        low_stock = sum(1 for m in medicines if m.is_low_stock)
        expiring_soon = sum(1 for m in medicines if m.is_expiring_soon)

        # Patient growth over the last 6 months
        six_months_ago = today.replace(day=1) - timedelta(days=180)
        growth_qs = (
            Patient.objects.filter(created_at__gte=six_months_ago)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        patient_growth = [{"month": row["month"].strftime("%b"), "count": row["count"]} for row in growth_qs]

        # Appointments grouped by status
        status_qs = Appointment.objects.values("status").annotate(count=Count("id"))
        appointments_by_status = [{"status": row["status"], "count": row["count"]} for row in status_qs]

        upcoming = (
            Appointment.objects.select_related("patient", "doctor")
            .filter(status="scheduled", date__gte=timezone.now())
            .order_by("date")[:5]
        )
        upcoming_data = [
            {
                "id": str(a.id),
                "patientId": str(a.patient_id),
                "doctorId": str(a.doctor_id),
                "patientName": f"{a.patient.first_name} {a.patient.last_name}",
                "doctorName": f"Dr. {a.doctor.first_name} {a.doctor.last_name}",
                "date": a.date,
                "duration": a.duration,
                "reason": a.reason,
                "status": a.status,
                "createdAt": a.created_at,
            }
            for a in upcoming
        ]

        recent_notifications = Notification.objects.order_by("-created_at")[:5]
        activity = [
            {"id": str(n.id), "message": n.message, "time": n.created_at} for n in recent_notifications
        ]

        return Response(
            {
                "todayAppointments": Appointment.objects.filter(date__range=(today_start, today_end)).count(),
                "totalPatients": Patient.objects.count(),
                "totalDoctors": Doctor.objects.count(),
                "totalMedicines": medicines.count(),
                "lowStock": low_stock,
                "expiringSoon": expiring_soon,
                "upcomingAppointments": upcoming_data,
                "patientGrowth": patient_growth,
                "appointmentsByStatus": appointments_by_status,
                "activity": activity,
            }
        )
