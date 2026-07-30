import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from patients.models import Patient

FIRST_NAMES = [
    "Ahmad", "Mona", "Kareem", "Huda", "Tariq", "Sara", "Yousef", "Layla", "Omar", "Rana",
    "Nour", "Ziad", "Dana", "Fadi", "Rima", "Bassam", "Lina", "Samer", "Maya", "Adel",
    "Hala", "Nabil", "Iman", "Waleed", "Reem", "Khalil", "Salma", "Anas", "Farah", "Bilal",
    "Dima", "Marwan", "Yasmin", "Hamza", "Rasha", "Suhail", "Nadia", "Amjad", "Ghada", "Rami",
    "Sana", "Firas", "Lubna", "Karim", "Wafa", "Jamal", "Amani", "Nasser", "Aya", "Mahmoud",
]
LAST_NAMES = [
    "Yousef", "Saleh", "Farouk", "Ziad", "Aziz", "Haddad", "Odeh", "Qassem", "Salameh", "Awad",
    "Zidane", "Barghouti", "Faris", "Khalil", "Suleiman", "Mansour", "Kanaan", "Jarrar", "Habash",
    "Shaheen", "Dajani", "Amer", "Khoury", "Nasser", "Hamdan", "Sabbagh", "Ayyad", "Turk", "Masri",
    "Qasem",
]
ALLERGY_POOL = ["Penicillin", "Peanuts", "Latex", "Aspirin", "Sulfa", "Pollen", "Dust", "Shellfish"]
BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
GENDERS = ["male", "female", "other"]

VISIT_NOTES = [
    "Annual checkup", "Flu symptoms", "Blood pressure follow-up", "Vaccination",
    "Minor injury", "Routine screening", "Consultation",
]


class Command(BaseCommand):
    help = "Seed the database with 50 realistic patients."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=50, help="Number of patients to create (default: 50)")
        parser.add_argument("--reset", action="store_true", help="Delete all existing patients first.")

    def handle(self, *args, **options):
        count = options["count"]

        if options["reset"]:
            deleted, _ = Patient.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing patient(s)."))

        created = 0
        used_names = set()

        for _ in range(count):
            # Avoid identical first+last name combos so records stay distinguishable.
            for _try in range(20):
                first = random.choice(FIRST_NAMES)
                last = random.choice(LAST_NAMES)
                if (first, last) not in used_names:
                    used_names.add((first, last))
                    break

            dob = date(random.randint(1945, 2021), random.randint(1, 12), random.randint(1, 28))
            allergies = random.sample(ALLERGY_POOL, k=random.randint(0, 2))

            patient = Patient.objects.create(
                first_name=first,
                last_name=last,
                email=f"{first.lower()}.{last.lower()}{random.randint(1,999)}@example.com",
                phone=f"05{random.randint(10000000, 99999999)}",
                gender=random.choice(GENDERS),
                dob=dob,
                blood_type=random.choice(BLOOD_TYPES),
                allergies=allergies,
                address=f"{random.randint(1, 200)} Main St, Nablus",
                emergency_contact_name=f"{random.choice(FIRST_NAMES)} {last}",
                emergency_contact_phone=f"05{random.randint(10000000, 99999999)}",
            )

            # A little medical history for realism (0-3 past visits).
            for _ in range(random.randint(0, 3)):
                patient.medical_history.create(
                    date=date.today() - timedelta(days=random.randint(10, 800)),
                    note=random.choice(VISIT_NOTES),
                )

            created += 1
            self.stdout.write(f"  + {patient.patient_code}  {patient.first_name} {patient.last_name}")

        self.stdout.write(self.style.SUCCESS(f"\nDone. Created {created} patient(s)."))
