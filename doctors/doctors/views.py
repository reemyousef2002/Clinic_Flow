from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import ReadOnlyOrAdmin
from .models import Doctor
from .serializers import DoctorSerializer


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["first_name", "last_name", "specialty", "department"]
    filterset_fields = ["department", "specialty", "available"]
    ordering_fields = ["created_at", "first_name"]

    def get_permissions(self):
        # Everyone authenticated can view the doctor directory; only admins manage it.
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), ReadOnlyOrAdmin()]
        return [IsAuthenticated()]
