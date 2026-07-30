import random
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from appointments.models import Appointment
from doctors.models import Doctor
from patients.models import Patient

REASONS = [
    "Consultation", "Follow-up", "Check-up", "Vaccination", "Screening",
    "Test Results", "Routine visit", "Prescription renewal",
]
DURATIONS = [15, 30, 45, 60]


class Command(BaseCommand):
    help = "Seed the database with 40 appointments spread across existing patients and doctors."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=40, help="Number of appointments to create (default: 40)")
        parser.add_argument("--reset", action="store_true", help="Delete all existing appointments first.")

    def handle(self, *args, **options):
        count = options["count"]

        patients = list(Patient.objects.all())
        doctors = list(Doctor.objects.all())

        if not patients or not doctors:
            self.stdout.write(self.style.ERROR(
                "No patients or doctors found. Run `seed_patients` and `seed_doctors` first."
            ))
            return

        if options["reset"]:
            deleted, _ = Appointment.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing appointment(s)."))

        created = 0
        attempts = 0
        max_attempts = count * 10  # avoid an infinite loop if slots keep colliding

        while created < count and attempts < max_attempts:
            attempts += 1
            doctor = random.choice(doctors)
            patient = random.choice(patients)

            # Spread across the past 30 days and next 30 days.
            offset_days = random.randint(-30, 30)
            hour = random.randint(8, 16)
            minute = random.choice([0, 15, 30, 45])
            naive_dt = datetime.combine(
                (timezone.now() + timedelta(days=offset_days)).date(),
                datetime.min.time(),
            ).replace(hour=hour, minute=minute)
            appt_date = timezone.make_aware(naive_dt)

            duration = random.choice(DURATIONS)

            # Skip if it overlaps an existing appointment for this doctor (mirrors the API's own guard).
            new_start, new_end = appt_date, appt_date + timedelta(minutes=duration)
            overlap = Appointment.objects.filter(doctor=doctor, status="scheduled").filter(
                date__lt=new_end
            )
            has_conflict = any(
                new_start < (a.date + timedelta(minutes=a.duration)) and a.date < new_end
                for a in overlap
            )
            if has_conflict:
                continue

            status = "scheduled" if offset_days >= 0 else random.choice(
                ["completed", "completed", "cancelled", "no-show"]
            )

            appt = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                date=appt_date,
                duration=duration,
                reason=random.choice(REASONS),
                status=status,
            )
            created += 1
            self.stdout.write(
                f"  + {appt.patient.first_name} {appt.patient.last_name} with "
                f"Dr. {appt.doctor.last_name} on {appt.date:%Y-%m-%d %H:%M} ({appt.status})"
            )

        self.stdout.write(self.style.SUCCESS(f"\nDone. Created {created} appointment(s)."))
