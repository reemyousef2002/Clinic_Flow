from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminOrDoctor, IsAdminOrReceptionist
from .models import MedicalHistoryEntry, Patient
from .serializers import MedicalHistoryEntrySerializer, PatientListSerializer, PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().prefetch_related("medical_history")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["patient_code", "first_name", "last_name", "email", "phone"]
    filterset_fields = ["gender", "blood_type"]
    ordering_fields = ["created_at", "first_name", "last_name"]

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        return PatientSerializer

    def get_permissions(self):
        # Doctors and admins can read everything; only admin/receptionist can create/update/delete.
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdminOrReceptionist()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrDoctor])
    def add_medical_history(self, request, pk=None):
        """Doctors add a note to a patient's medical history after a consultation."""
        patient = self.get_object()
        serializer = MedicalHistoryEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(patient=patient)
        return Response(PatientSerializer(patient).data)
