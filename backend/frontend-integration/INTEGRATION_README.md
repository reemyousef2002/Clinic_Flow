# Connecting the Frontend to the Real Backend

This folder contains a **drop-in replacement** for your frontend's
`src/lib/mock-api.ts`, plus its two supporting files. Same exported names
(`authApi`, `patientsApi`, `doctorsApi`, `appointmentsApi`, `medicinesApi`,
`notificationsApi`, `dashboardApi`, `reportsApi`) — so no other file in your
app needs to change. Only the internals changed: instead of reading/writing
`localStorage`, every function now calls your Django API.

## 1. Copy these 3 files into your frontend project

From this folder, copy into `clinicflow-your-practice-perfected-main/src/lib/`:

```
api-client.ts        →  src/lib/api-client.ts
transformers.ts       →  src/lib/transformers.ts
mock-api.ts           →  src/lib/mock-api.ts   (OVERWRITE the existing one)
```

## 2. Delete the now-unused fake-data files

```
src/lib/db.ts
src/lib/seed.ts
```

Nothing else imports these once `mock-api.ts` is replaced, so it's safe to
delete both.

## 3. Set your `.env`

In the root of `clinicflow-your-practice-perfected-main` (next to
`package.json`), create/edit `.env`:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

Restart `npm run dev` / `bun run dev` after adding or changing `.env` —
Vite only reads it at startup.

## 4. Update the backend's CORS setting to match your actual dev port

Your terminal showed Vite landed on **`http://localhost:8081`** (8080 was
already taken). In `clinicflow_backend/.env`:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8081
```

(The shipped defaults now include 8081 already, but if Vite picks yet another
port next time, add it here too — otherwise the browser will block requests
with a CORS error even though the backend is running fine.)

## 5. Start both servers

```powershell
# Terminal 1 — backend
cd clinicflow_backend
python manage.py runserver

# Terminal 2 — frontend
cd clinicflow-your-practice-perfected-main
npm run dev   # or: bun run dev
```

Log in with one of the seeded accounts (see the backend README):
`admin@clinicflow.com` / `password123`.

## 6. What changed vs. the mock, and why

| Concern | Mock behavior | Real backend behavior |
|---|---|---|
| Data storage | `localStorage`, reset per-browser | Django database (SQLite/Postgres), shared for everyone |
| Auth token | Fake base64 JSON, never expires | Real JWT, expires after 8h; auto-refreshed once silently on a 401 using a refresh token (valid 7 days) |
| List endpoints | Returned everything in one call | Paginated by Django REST Framework — `mock-api.ts` now automatically follows `next` pages and returns the full list, so calling code doesn't need to change |
| Field names | camelCase everywhere (`firstName`, `bloodType`, etc.) | Backend uses snake_case (`first_name`, `blood_type`); `transformers.ts` converts both directions automatically |
| Notifications | Manually seeded | Low-stock and expiring-medicine notifications are created automatically by the backend whenever a medicine is saved |

## 7. Known gaps to revisit later

- **`reportsApi.summary()`**: there's no `/reports/` endpoint or revenue/billing
  model on the backend yet, so `revenueByMonth` currently comes back as an
  empty array instead of real numbers. `stockByCategory`, `appointmentsByMonth`,
  and `patientGrowth` are computed correctly from real data. Add a `Bill`/
  `Invoice` model and a reports endpoint when you're ready to track revenue.
- **Session refresh**: if a user leaves a tab open past 8 hours with no
  activity, the next request refreshes the token silently — but if the
  7-day refresh token itself expires, they'll simply need to log in again.
- **SSR data loaders**: if any TanStack route loader fetches data on the
  server (not just in the browser), it won't have access to the token stored
  in the browser's `localStorage`/`sessionStorage`. Client-side fetches (e.g.
  via `useQuery`) are unaffected.
