from django.contrib import admin

from .models import MedicalHistoryEntry, Patient


class MedicalHistoryInline(admin.TabularInline):
    model = MedicalHistoryEntry
    extra = 0


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ["patient_code", "first_name", "last_name", "phone", "gender", "blood_type", "created_at"]
    search_fields = ["patient_code", "first_name", "last_name", "phone", "email"]
    list_filter = ["gender", "blood_type"]
    inlines = [MedicalHistoryInline]
