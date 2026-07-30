from datetime import time

from django.utils import timezone

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminOrReceptionist
from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related("patient", "doctor").all()
    serializer_class = AppointmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "doctor", "patient"]
    search_fields = ["reason", "patient__first_name", "patient__last_name"]
    ordering_fields = ["date", "created_at"]

    def get_permissions(self):
        # Doctors can view + update their own appointments (e.g. mark completed, add notes);
        # only admin/receptionist can create/cancel/reschedule.
        if self.action in ("create", "destroy"):
            return [IsAuthenticated(), IsAdminOrReceptionist()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Doctors only see their own appointments by default.
        if user.role == "doctor" and hasattr(user, "doctor_profile") and user.doctor_profile:
            qs = qs.filter(doctor=user.doctor_profile)
        return qs

    @action(detail=False, methods=["get"])
    def today(self, request):
        """Appointments scheduled for today — powers the Dashboard's 'Today's Appointments' stat."""
        today = timezone.localdate()
        start = timezone.make_aware(timezone.datetime.combine(today, time.min))
        end = timezone.make_aware(timezone.datetime.combine(today, time.max))
        qs = self.get_queryset().filter(date__range=(start, end))
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Next scheduled appointments — powers the Dashboard's 'Upcoming Appointments' list."""
        qs = self.get_queryset().filter(status="scheduled", date__gte=timezone.now()).order_by("date")[:10]
        return Response(self.get_serializer(qs, many=True).data)
