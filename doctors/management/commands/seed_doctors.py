from django.core.management.base import BaseCommand

from doctors.models import Doctor

# 20 doctors — one per (department, specialty) combination, covering every
# department your frontend's mock data used, so the dropdown filters look
# realistic immediately.
DOCTORS = [
    ("Rana", "Ibrahim", "Cardiology", "Interventional Cardiology"),
    ("Samir", "Haddad", "Cardiology", "Electrophysiology"),
    ("Layla", "Nasser", "Pediatrics", "Neonatology"),
    ("Yousef", "Odeh", "Pediatrics", "Pediatric Surgery"),
    ("Huda", "Qassem", "Neurology", "Stroke Care"),
    ("Tariq", "Salameh", "Neurology", "Epilepsy"),
    ("Mona", "Awad", "Orthopedics", "Sports Medicine"),
    ("Karim", "Zidane", "Orthopedics", "Joint Replacement"),
    ("Dalia", "Barghouti", "Dermatology", "Cosmetic Dermatology"),
    ("Nabil", "Faris", "Dermatology", "Pediatric Dermatology"),
    ("Omar", "Khalil", "General Medicine", "Internal Medicine"),
    ("Amal", "Suleiman", "General Medicine", "Family Medicine"),
    ("Ziad", "Mansour", "Radiology", "Diagnostic Radiology"),
    ("Reem", "Kanaan", "Radiology", "Interventional Radiology"),
    ("Bassam", "Jarrar", "Oncology", "Medical Oncology"),
    ("Nadia", "Habash", "Oncology", "Radiation Oncology"),
    ("Fadi", "Shaheen", "Psychiatry", "Adult Psychiatry"),
    ("Rania", "Dajani", "Psychiatry", "Child & Adolescent Psychiatry"),
    ("Hassan", "Amer", "ENT", "Otology"),
    ("Suzan", "Khoury", "ENT", "Rhinology"),
]

WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Sun"]


class Command(BaseCommand):
    help = "Seed the database with 20 realistic doctors, one per department/specialty."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing doctors before seeding fresh ones.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            deleted, _ = Doctor.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing doctor(s)."))

        created_count = 0
        skipped_count = 0

        for first, last, department, specialty in DOCTORS:
            doctor, created = Doctor.objects.get_or_create(
                first_name=first,
                last_name=last,
                defaults={
                    "email": f"{first.lower()}.{last.lower()}@clinicflow.com",
                    "phone": "0590000000",
                    "department": department,
                    "specialty": specialty,
                    "available": True,
                    "working_hours_start": "09:00",
                    "working_hours_end": "17:00",
                    "working_days": WORKING_DAYS,
                    "bio": f"Specialist in {specialty.lower()}, part of the {department} department.",
                },
            )
            if created:
                created_count += 1
                self.stdout.write(f"  + Dr. {first} {last} ({department} — {specialty})")
            else:
                skipped_count += 1

        self.stdout.write(self.style.SUCCESS(f"\nDone. Created {created_count} doctor(s), skipped {skipped_count} (already existed)."))