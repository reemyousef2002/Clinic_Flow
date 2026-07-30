import uuid

from django.db import models, transaction


class Patient(models.Model):
    GENDER_CHOICES = [("male", "Male"), ("female", "Female"), ("other", "Other")]
    BLOOD_TYPE_CHOICES = [
        ("A+", "A+"), ("A-", "A-"),
        ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"),
        ("O+", "O+"), ("O-", "O-"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_code = models.CharField(
        max_length=20, unique=True, editable=False, blank=True,
        help_text="Human-friendly ID (e.g. PT-00001) — easy to search/reference at the front desk.",
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    dob = models.DateField()
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES)
    allergies = models.JSONField(default=list, blank=True)
    address = models.CharField(max_length=255, blank=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.patient_code} — {self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.patient_code:
            with transaction.atomic():
                last = (
                    Patient.objects.select_for_update()
                    .exclude(patient_code="")
                    .order_by("-patient_code")
                    .first()
                )
                last_num = int(last.patient_code.split("-")[1]) if last else 0
                self.patient_code = f"PT-{last_num + 1:05d}"
        super().save(*args, **kwargs)


class MedicalHistoryEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, related_name="medical_history", on_delete=models.CASCADE)
    date = models.DateField()
    note = models.TextField()
    doctor = models.ForeignKey(
        "doctors.Doctor", null=True, blank=True, on_delete=models.SET_NULL, related_name="notes_written"
    )

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.patient} — {self.date}"
