import uuid

from django.db import models


class Appointment(models.Model):
    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("no-show", "No-show"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey("patients.Patient", related_name="appointments", on_delete=models.CASCADE)
    doctor = models.ForeignKey("doctors.Doctor", related_name="appointments", on_delete=models.CASCADE)
    date = models.DateTimeField()
    duration = models.PositiveIntegerField(default=30, help_text="Duration in minutes")
    reason = models.CharField(max_length=255)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date"]

    def __str__(self):
        return f"{self.patient} with {self.doctor} on {self.date:%Y-%m-%d %H:%M}"
