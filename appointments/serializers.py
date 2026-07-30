from datetime import timedelta

from rest_framework import serializers

from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id", "patient", "patient_name", "doctor", "doctor_name",
            "date", "duration", "reason", "notes", "status", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}"

    def validate(self, attrs):
        """Prevent double-booking: reject overlapping appointments for the same doctor. (FR3 / US-03)"""
        doctor = attrs.get("doctor") or getattr(self.instance, "doctor", None)
        date = attrs.get("date") or getattr(self.instance, "date", None)
        duration = attrs.get("duration") or getattr(self.instance, "duration", 30)

        if doctor and date:
            new_start = date
            new_end = date + timedelta(minutes=duration)

            qs = Appointment.objects.filter(doctor=doctor, status="scheduled").exclude(
                pk=getattr(self.instance, "pk", None)
            )
            for appt in qs:
                existing_start = appt.date
                existing_end = appt.date + timedelta(minutes=appt.duration)
                if new_start < existing_end and existing_start < new_end:
                    raise serializers.ValidationError(
                        f"Dr. {doctor.first_name} {doctor.last_name} already has an appointment "
                        f"overlapping this time slot."
                    )
        return attrs
