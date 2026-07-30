from datetime import date, timedelta

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdmin
from .models import Medicine
from .serializers import MedicineSerializer


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name", "category", "supplier"]
    filterset_fields = ["category"]
    ordering_fields = ["name", "quantity", "expiry_date", "created_at"]

    def get_permissions(self):
        # Everyone authenticated can view inventory; only admins manage stock (FR7/US-06).
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        qs = [m for m in self.get_queryset() if m.is_low_stock]
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def expiring_soon(self, request):
        cutoff = date.today() + timedelta(days=30)
        qs = self.get_queryset().filter(expiry_date__lte=cutoff)
        return Response(self.get_serializer(qs, many=True).data)
