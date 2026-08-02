<div align="center">

# 🩺 ClinicFlow

**A centralized Clinic Management System for small and medium-sized medical clinics.**

Replaces paper records, spreadsheets, and WhatsApp messages with one secure, web-based platform for appointments, patients, doctors, and inventory.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?logo=react-query&logoColor=white)](https://tanstack.com/start)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Django](https://img.shields.io/badge/Django-5-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django%20REST-Framework-A30000?logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

</div>

---

## Overview

ClinicFlow is a full-stack clinic management system with a **React / TanStack Start** frontend and a **Django REST Framework** backend, connected over a JWT-authenticated API. It's built for clinics running on manual processes — scheduling by phone, tracking inventory in a notebook, storing patient history on paper — and brings all of it into one role-based platform.

## Features

- 🔐 **Role-based access** — Admin, Doctor, and Receptionist each see only what they need, enforced server-side
- 🧑‍🤝‍🧑 **Patient records** — digital profiles with medical history, allergies, blood type, and auto-generated human-friendly IDs (`PT-00001`)
- 🩺 **Doctor directory** — departments, specialties, working hours, live availability
- 📅 **Appointments** — book, reschedule, cancel — with automatic double-booking prevention
- 💊 **Medicine inventory** — stock, supplier, and expiry tracking with searchable codes (`MED-0001`)
- 🔔 **Smart alerts** — notifications auto-generated when stock is low or medicine is expiring soon
- 📊 **Live dashboard** — today's appointments, patient growth, appointment status breakdown
- 📈 **Reports** — stock-by-category, appointment trends, patient growth over time

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | [TanStack Start](https://tanstack.com/start) (full-stack React) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4, Radix UI |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend framework | Django 5 + Django REST Framework |
| Auth | SimpleJWT (access + refresh tokens) |
| Database | SQLite (dev) / PostgreSQL (production-ready) |
| Other | django-cors-headers, django-filter |

## Architecture

```
Routes / Pages  (Dashboard, Patients, Doctors, Appointments, Medicines, Reports)
        │
Layout & Shared UI  (AppShell, PageHeader, StatCard, EmptyState, Skeletons)
        │
Hooks & State  (useAuth — JWT session, TanStack Query cache)
        │
API Adapter  (src/lib/mock-api.ts — same function names, real fetch calls)
        │
Django REST API  (JWT auth · role permissions · double-booking guard · auto-notifications)
        │
Database  (SQLite dev / PostgreSQL production)
```

The frontend never talks to the database directly — everything goes through the API adapter layer, so the backend can evolve independently of the UI.

## Project Structure

```
clinicflow/
├── backend/                     # Django REST API
│   ├── accounts/                 # Custom User model, JWT auth, permissions
│   ├── patients/                 # Patient + medical history
│   ├── doctors/                  # Doctor directory
│   ├── appointments/             # Booking, conflict checks
│   ├── medicines/                # Inventory + auto-notification signals
│   ├── notifications/            # Notification feed
│   ├── dashboard/                # Aggregate stats endpoint + seed commands
│   └── manage.py
│
└── frontend/                    # TanStack Start app
    ├── src/
    │   ├── routes/                # Page routes (dashboard, patients, etc.)
    │   ├── components/            # Shared UI components
    │   ├── hooks/                 # useAuth, useIsMobile
    │   ├── lib/                   # API client, transformers, mock-api adapter
    │   └── types/                 # Shared TypeScript types
    └── package.json
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js + npm (or Bun)

### Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env

python manage.py migrate
python manage.py seed_data        # creates demo login accounts
python manage.py seed_doctors     # 20 sample doctors
python manage.py seed_patients    # 50 sample patients
python manage.py seed_medicines   # 50 sample medicines
python manage.py seed_appointments # 40 sample appointments

python manage.py runserver
```

API runs at `http://localhost:8000/api/`. Admin panel at `http://localhost:8000/admin/`.

### Frontend setup

```bash
cd frontend
npm install
```

Create `.env` in the frontend root:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

```bash
npm run dev
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@clinicflow.com` | `password123` |
| Doctor | `doctor@clinicflow.com` | `password123` |
| Receptionist | `reception@clinicflow.com` | `password123` |

## API Overview

All endpoints are prefixed with `/api/` and require a `Authorization: Bearer <token>` header (except auth endpoints).

| Endpoint | Description |
|---|---|
| `POST /auth/login/` | Returns `{ token, refresh, user }` |
| `POST /auth/register/` | Create a new account |
| `GET/PATCH /auth/profile/` | View/update the logged-in user |
| `GET/POST /patients/` | List / create patients (searchable by name, phone, `patient_code`) |
| `GET/POST /doctors/` | List / create doctors |
| `GET/POST /appointments/` | List / book appointments (rejects overlapping bookings) |
| `GET/POST /medicines/` | List / create medicines (searchable by name, `code`) |
| `GET /notifications/` | Personal + clinic-wide notifications |
| `GET /dashboard/stats/` | Aggregate dashboard data |

## Roles & Permissions

| Action | Admin | Doctor | Receptionist |
|---|:---:|:---:|:---:|
| View patients / doctors / appointments / medicines | ✅ | ✅ | ✅ |
| Register or edit patients | ✅ | ❌ | ✅ |
| Add medical history notes | ✅ | ✅ | ❌ |
| Book / cancel appointments | ✅ | ❌ | ✅ |
| Manage medicine inventory | ✅ | ❌ | ❌ |
| Manage doctor directory | ✅ | ❌ | ❌ |

## Roadmap

- [ ] Migrate to PostgreSQL for production
- [ ] Public patient self-booking portal
- [ ] Billing & invoicing
- [ ] Telemedicine / video consultations
- [ ] Exportable PDF/Excel reports
- [ ] Audit logs for compliance

## License

MIT — feel free to fork and adapt for your own clinic.

---

<div align="center">
Built with ❤️ using React, TanStack Start, and Django REST Framework.
</div>
