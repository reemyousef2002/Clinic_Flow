import random
from datetime import date, timedelta

from django.utils import timezone

from django.core.management.base import BaseCommand

from accounts.models import User
from appointments.models import Appointment
from doctors.models import Doctor
from medicines.models import Medicine
from patients.models import Patient


class Command(BaseCommand):
    help = "Seed the database with sample ClinicFlow data for local development/demo purposes."

    def handle(self, *args, **options):
        self.stdout.write("Seeding ClinicFlow demo data...")

        # --- Users ---
        admin, created = User.objects.get_or_create(
            email="admin@clinicflow.com", defaults={"name": "Dr. Sarah Chen", "role": "admin"}
        )
        if created:
            admin.set_password("password123")
            admin.save()

        receptionist, created = User.objects.get_or_create(
            email="reception@clinicflow.com", defaults={"name": "Lina Haddad", "role": "receptionist"}
        )
        if created:
            receptionist.set_password("password123")
            receptionist.save()

        # --- Doctors ---
        doctor_names = [
            ("Rana", "Ibrahim", "Cardiology", "Heart specialist"),
            ("Omar", "Khalil", "General Medicine", "Family physician"),
            ("Layla", "Nasser", "Pediatrics", "Child specialist"),
        ]
        doctors = []
        for first, last, dept, specialty in doctor_names:
            doc, _ = Doctor.objects.get_or_create(
                first_name=first, last_name=last,
                defaults={
                    "department": dept, "specialty": specialty, "available": True,
                    "working_hours_start": "09:00", "working_hours_end": "17:00",
                    "working_days": ["Mon", "Tue", "Wed", "Thu", "Sun"],
                    "email": f"{first.lower()}.{last.lower()}@clinicflow.com",
                },
            )
            doctors.append(doc)

        doc_user, created = User.objects.get_or_create(
            email="doctor@clinicflow.com", defaults={"name": "Dr. Omar Khalil", "role": "doctor"}
        )
        if created:
            doc_user.set_password("password123")
            doc_user.save()
        doctors[1].user = doc_user
        doctors[1].save()

        # --- Patients ---
        patient_names = [
            ("Ahmad", "Yousef"), ("Mona", "Saleh"), ("Kareem", "Farouk"),
            ("Huda", "Ziad"), ("Tariq", "Aziz"),
        ]
        patients = []
        for first, last in patient_names:
            p, _ = Patient.objects.get_or_create(
                first_name=first, last_name=last,
                defaults={
                    "phone": f"05{random.randint(10000000, 99999999)}",
                    "gender": random.choice(["male", "female"]),
                    "dob": date(1990, 1, 1) + timedelta(days=random.randint(0, 10000)),
                    "blood_type": random.choice(["A+", "B+", "O+", "AB-"]),
                    "allergies": [],
                    "address": "Nablus, Palestine",
                    "emergency_contact_name": "N/A",
                    "emergency_contact_phone": "N/A",
                },
            )
            patients.append(p)

        # --- Appointments ---
        for i, patient in enumerate(patients):
            Appointment.objects.get_or_create(
                patient=patient,
                doctor=doctors[i % len(doctors)],
                date=timezone.now() + timedelta(days=i, hours=1),
                defaults={"duration": 30, "reason": "Checkup", "status": "scheduled"},
            )

        # --- Medicines ---
        medicine_data = [
            ("Amoxicillin", "Antibiotic", 8, 2.50, "MediSupply Co.", 5),
            ("Paracetamol", "Painkiller", 200, 0.50, "PharmaPlus", 20),
            ("Insulin", "Hormone", 15, 12.00, "MediSupply Co.", 10),
        ]
        for name, category, qty, price, supplier, reorder in medicine_data:
            Medicine.objects.get_or_create(
                name=name,
                defaults={
                    "category": category, "quantity": qty, "price": price,
                    "supplier": supplier, "expiry_date": date.today() + timedelta(days=20),
                    "reorder_level": reorder,
                },
            )

        self.stdout.write(self.style.SUCCESS("Seed data created successfully."))
        self.stdout.write("Login with: admin@clinicflow.com / password123 (role: admin)")
        self.stdout.write("            reception@clinicflow.com / password123 (role: receptionist)")
        self.stdout.write("            doctor@clinicflow.com / password123 (role: doctor)")
