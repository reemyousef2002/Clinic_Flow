# ClinicFlow — Django Backend

A Django REST Framework API that replaces the frontend's mocked data
(`@/lib/mock-api`) with a real backend — matching the models, roles, and
endpoints your React/TanStack Start app already expects.

## Tech Stack

- Django 5/6 + Django REST Framework
- SimpleJWT (JSON Web Token authentication)
- django-cors-headers
- django-filter (search/filter/ordering on list endpoints)
- SQLite by default (PostgreSQL-ready via environment variables)

## 1. Setup

```bash
cd clinicflow_backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env            # then edit values as needed

python manage.py migrate
python manage.py seed_data      # optional: creates demo users/patients/doctors/etc.
python manage.py createsuperuser  # optional: to log into /admin/

python manage.py runserver
```

The API is now available at `http://localhost:8000/api/`.
The Django admin is available at `http://localhost:8000/admin/`.

### Demo accounts (created by `seed_data`)

| Role         | Email                        | Password      |
|--------------|-------------------------------|---------------|
| Admin        | admin@clinicflow.com          | password123   |
| Doctor       | doctor@clinicflow.com         | password123   |
| Receptionist | reception@clinicflow.com      | password123   |

## 2. Project Structure

```
clinicflow_backend/
├── clinicflow/          # Django project settings, root urls
├── accounts/            # Custom User model, JWT auth, permissions
├── patients/            # Patient + MedicalHistoryEntry
├── doctors/             # Doctor directory
├── appointments/        # Appointment booking (with double-booking guard)
├── medicines/           # Inventory + auto low-stock/expiry notifications (signals)
├── notifications/       # Notification feed
├── dashboard/           # Aggregate dashboard-stats endpoint + seed_data command
└── requirements.txt
```

## 3. Authentication

JWT-based. Every request (except login/register) must include:

```
Authorization: Bearer <token>
```

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register/` | POST | Create a new user account |
| `/api/auth/login/` | POST | Returns `{ token, refresh, user }` |
| `/api/auth/logout/` | POST | Blacklists the refresh token |
| `/api/auth/refresh/` | POST | Exchange a refresh token for a new access token |
| `/api/auth/profile/` | GET / PATCH | View or update the logged-in user's profile |

This mirrors the frontend's `AuthResponse` shape (`{ token, user }`) and the
`useAuth()` hook's `login / register / logout / updateProfile` methods —
you should be able to swap `authApi` in `mock-api.ts` to call these directly.

## 4. Roles & Permissions

Three roles, matching `types/index.ts`: `admin`, `doctor`, `receptionist`.

| Action | Admin | Doctor | Receptionist |
|---|:---:|:---:|:---:|
| View patients / doctors / appointments / medicines | ✅ | ✅ | ✅ |
| Register / edit patients | ✅ | ❌ | ✅ |
| Add medical history notes | ✅ | ✅ | ❌ |
| Book / cancel appointments | ✅ | ❌ | ✅ |
| Doctors see only their own appointments | — | ✅ | — |
| Manage medicine inventory (create/edit/delete) | ✅ | ❌ | ❌ |
| Manage doctor directory (create/edit/delete) | ✅ | ❌ | ❌ |

Enforced via custom permission classes in `accounts/permissions.py`
(`IsAdmin`, `IsDoctor`, `IsAdminOrReceptionist`, `IsAdminOrDoctor`, `ReadOnlyOrAdmin`).

## 5. Main Endpoints

All endpoints below are prefixed with `/api/` and require a Bearer token
unless noted otherwise.

### Patients
- `GET/POST /patients/` — list (paginated, searchable by name/phone/email) / create
- `GET/PUT/PATCH/DELETE /patients/{id}/` — retrieve/update/delete
- `POST /patients/{id}/add_medical_history/` — doctor/admin adds a history note

### Doctors
- `GET/POST /doctors/` — list / create (admin only to write)
- `GET/PUT/PATCH/DELETE /doctors/{id}/`

### Appointments
- `GET/POST /appointments/` — list / book (rejects overlapping bookings for the same doctor)
- `GET/PUT/PATCH/DELETE /appointments/{id}/`
- `GET /appointments/today/` — today's appointments
- `GET /appointments/upcoming/` — next 10 scheduled appointments

### Medicines
- `GET/POST /medicines/` — list / create (admin only to write)
- `GET/PUT/PATCH/DELETE /medicines/{id}/`
- `GET /medicines/low_stock/`
- `GET /medicines/expiring_soon/`

### Notifications
- `GET /notifications/` — clinic-wide + personal notifications
- `POST /notifications/{id}/mark_read/`
- `POST /notifications/mark_all_read/`

### Dashboard
- `GET /dashboard/stats/` — single aggregate payload matching the frontend's
  `DashboardStats` type: `todayAppointments`, `totalPatients`, `totalDoctors`,
  `totalMedicines`, `lowStock`, `expiringSoon`, `upcomingAppointments`,
  `patientGrowth`, `appointmentsByStatus`, `activity`.

All list endpoints support `?search=`, `?ordering=`, and relevant
`?field=value` filters (e.g. `/appointments/?status=scheduled`).

## 6. Automatic Notifications

A `post_save` signal on `Medicine` (`medicines/signals.py`) automatically
creates a `warning` notification whenever:
- stock quantity falls at or below `reorder_level` ("Low stock alert"), or
- the expiry date is within 30 days ("Medicine expiring soon").

Duplicate alerts for the same medicine are suppressed while an existing
unread notification for it is still active.

## 7. Switching from PostgreSQL

By default the project uses SQLite for zero-config local development. To use
PostgreSQL instead, set these environment variables (see `.env.example`) and
re-run `migrate`:

```
POSTGRES_DB=clinicflow
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## 8. Connecting the Frontend

In your TanStack Start app, replace the contents of `@/lib/mock-api` with
real `fetch`/axios calls to `http://localhost:8000/api/...`, using the same
function names (`authApi.login`, `notificationsApi.list`, etc.) so no
component code needs to change. Make sure `CORS_ALLOWED_ORIGINS` in `.env`
includes your frontend's dev URL (defaults already include
`localhost:3000` and `localhost:5173`).

## 9. Production Notes

Before deploying:
- Set `DJANGO_DEBUG=False` and a strong `DJANGO_SECRET_KEY`.
- Set `DJANGO_ALLOWED_HOSTS` to your real domain(s).
- Switch to PostgreSQL.
- Serve static files via `collectstatic` + a real web server (nginx) or
  WhiteNoise.
- Run behind Gunicorn/Uvicorn instead of `manage.py runserver`.
- Store the avatar/file uploads in real object storage (e.g. S3) if you
  move `avatar` from a URL field to an uploaded file.
