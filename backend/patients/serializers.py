from rest_framework import serializers

from .models import MedicalHistoryEntry, Patient


class MedicalHistoryEntrySerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.__str__", read_only=True, default=None)

    class Meta:
        model = MedicalHistoryEntry
        fields = ["id", "date", "note", "doctor", "doctor_name"]
        read_only_fields = ["id"]


class PatientSerializer(serializers.ModelSerializer):
    medical_history = MedicalHistoryEntrySerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id", "patient_code", "first_name", "last_name", "full_name", "email", "phone",
            "gender", "dob", "blood_type", "allergies", "address",
            "emergency_contact_name", "emergency_contact_phone",
            "medical_history", "created_at",
        ]
        read_only_fields = ["id", "patient_code", "created_at"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class PatientListSerializer(serializers.ModelSerializer):
    """Lighter payload for table/list views."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id", "patient_code", "first_name", "last_name", "full_name",
            "phone", "email", "gender", "blood_type", "dob", "allergies", "created_at",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
