from rest_framework import serializers

from .models import Doctor


class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    working_hours = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            "id", "user", "first_name", "last_name", "full_name", "email", "phone",
            "department", "specialty", "available",
            "working_hours_start", "working_hours_end", "working_days", "working_hours",
            "bio", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "working_hours_start": {"write_only": True},
            "working_hours_end": {"write_only": True},
            "working_days": {"write_only": True},
        }

    def get_full_name(self, obj):
        return f"Dr. {obj.first_name} {obj.last_name}"

    def get_working_hours(self, obj):
        return {
            "start": obj.working_hours_start.strftime("%H:%M"),
            "end": obj.working_hours_end.strftime("%H:%M"),
            "days": obj.working_days,
        }
