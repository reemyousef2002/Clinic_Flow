import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from medicines.models import Medicine

MED_NAMES = [
    "Amoxicillin", "Ibuprofen", "Paracetamol", "Metformin", "Lisinopril", "Atorvastatin",
    "Omeprazole", "Amlodipine", "Losartan", "Albuterol", "Cetirizine", "Loratadine",
    "Prednisone", "Azithromycin", "Ciprofloxacin", "Doxycycline", "Hydrochlorothiazide",
    "Simvastatin", "Gabapentin", "Sertraline", "Fluoxetine", "Warfarin", "Furosemide",
    "Insulin", "Levothyroxine", "Vitamin D", "Vitamin B12", "Aspirin", "Naproxen", "Diazepam",
]
STRENGTHS = ["250mg", "500mg", "10mg", "20mg", "5ml", "1g", "100mg"]
CATEGORIES = [
    "Antibiotic", "Analgesic", "Antihypertensive", "Antidiabetic", "Antihistamine",
    "Vitamin", "Antiviral", "Cardiac", "Respiratory", "Dermatological",
]
SUPPLIERS = ["MedSupply Co.", "PharmaCorp", "HealthPlus", "BioMedix", "GlobalMeds", "CareRx"]


class Command(BaseCommand):
    help = "Seed the database with 50 realistic medicines, each with a searchable code (MED-0001, ...)."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=50, help="Number of medicines to create (default: 50)")
        parser.add_argument("--reset", action="store_true", help="Delete all existing medicines first.")

    def handle(self, *args, **options):
        count = options["count"]

        if options["reset"]:
            deleted, _ = Medicine.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing medicine(s)."))

        created = 0
        used_names = set()

        for _ in range(count):
            for _try in range(20):
                name = f"{random.choice(MED_NAMES)} {random.choice(STRENGTHS)}"
                if name not in used_names:
                    used_names.add(name)
                    break

            quantity = random.randint(0, 400)
            reorder_level = random.randint(20, 60)
            # Bias ~15% of stock toward being at/under reorder level, and ~15% toward expiring soon,
            # so the low-stock/expiring-soon dashboard alerts have something real to show.
            if random.random() < 0.15:
                quantity = random.randint(0, reorder_level)
            expiry_days = random.randint(20, 900)
            if random.random() < 0.15:
                expiry_days = random.randint(-10, 25)

            medicine = Medicine.objects.create(
                name=name,
                category=random.choice(CATEGORIES),
                quantity=quantity,
                price=round(random.uniform(2, 200), 2),
                supplier=random.choice(SUPPLIERS),
                expiry_date=date.today() + timedelta(days=expiry_days),
                reorder_level=reorder_level,
            )
            created += 1
            self.stdout.write(f"  + {medicine.code}  {medicine.name}  (qty {medicine.quantity}, reorder@{medicine.reorder_level})")

        self.stdout.write(self.style.SUCCESS(f"\nDone. Created {created} medicine(s)."))
