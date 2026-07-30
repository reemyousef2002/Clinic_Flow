/**
 * Real backend adapter — same exports and function signatures as the old
 * mock-api.ts, so every existing import (`authApi`, `patientsApi`,
 * `notificationsApi`, etc.) keeps working with zero changes anywhere else
 * in the app. Only the implementation changed: instead of reading/writing
 * localStorage, every function now calls the Django REST API.
 *
 * Requires VITE_API_BASE_URL in your .env (defaults to http://localhost:8000/api).
 */
import type {
  Appointment,
  AuthResponse,
  DashboardStats,
  Doctor,
  Medicine,
  Notification,
  Patient,
  User,
} from "@/types";
import { apiFetch, apiFetchAllPages, clearTokens, setRefreshToken } from "./api-client";
import {
  appointmentFromApi,
  appointmentToApi,
  doctorFromApi,
  doctorToApi,
  medicineFromApi,
  medicineToApi,
  notificationFromApi,
  patientFromApi,
  patientToApi,
  userFromApi,
} from "./transformers";

/** Kept for backwards compatibility with any code that imported this from the old mock-api. */
export function parseToken(token: string): { sub: string; iat: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { sub: payload.user_id, iat: payload.iat };
  } catch {
    return null;
  }
}

// ---------- AUTH ----------
export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiFetch<{ token: string; refresh: string; user: any }>("/auth/login/", {
      method: "POST",
      body: { email, password },
    });
    setRefreshToken(res.refresh);
    return { token: res.token, user: userFromApi(res.user) };
  },

  async register(input: { name: string; email: string; password: string; role?: User["role"] }): Promise<AuthResponse> {
    const res = await apiFetch<{ token: string; refresh: string; user: any }>("/auth/register/", {
      method: "POST",
      body: input,
    });
    setRefreshToken(res.refresh);
    return { token: res.token, user: userFromApi(res.user) };
  },

  async logout() {
    try {
      await apiFetch("/auth/logout/", { method: "POST" });
    } finally {
      clearTokens();
    }
    return { ok: true };
  },

  async profile(token: string): Promise<Omit<User, "password">> {
    const res = await apiFetch<any>("/auth/profile/", { tokenOverride: token });
    return userFromApi(res);
  },

  async updateProfile(token: string, patch: Partial<Pick<User, "name" | "email" | "phone" | "avatar">>) {
    const res = await apiFetch<any>("/auth/profile/", {
      method: "PATCH",
      body: patch,
      tokenOverride: token,
    });
    return userFromApi(res);
  },
};

// ---------- PATIENTS ----------
export const patientsApi = {
  async list(): Promise<Patient[]> {
    const raw = await apiFetchAllPages<any>("/patients/");
    return raw.map(patientFromApi);
  },
  async get(id: string): Promise<Patient> {
    const raw = await apiFetch<any>(`/patients/${id}/`);
    return patientFromApi(raw);
  },
  async create(input: Omit<Patient, "id" | "createdAt" | "medicalHistory">): Promise<Patient> {
    const raw = await apiFetch<any>("/patients/", { method: "POST", body: patientToApi(input) });
    return patientFromApi(raw);
  },
  async update(id: string, patch: Partial<Patient>): Promise<Patient> {
    const raw = await apiFetch<any>(`/patients/${id}/`, { method: "PATCH", body: patientToApi(patch) });
    return patientFromApi(raw);
  },
  async remove(id: string): Promise<{ ok: true }> {
    await apiFetch(`/patients/${id}/`, { method: "DELETE" });
    return { ok: true };
  },
  async addMedicalHistory(id: string, entry: { date: string; note: string; doctor?: string }) {
    const raw = await apiFetch<any>(`/patients/${id}/add_medical_history/`, { method: "POST", body: entry });
    return patientFromApi(raw);
  },
};

// ---------- DOCTORS ----------
export const doctorsApi = {
  async list(): Promise<Doctor[]> {
    const raw = await apiFetchAllPages<any>("/doctors/");
    return raw.map(doctorFromApi);
  },
  async get(id: string): Promise<Doctor> {
    const raw = await apiFetch<any>(`/doctors/${id}/`);
    return doctorFromApi(raw);
  },
  async create(input: Omit<Doctor, "id" | "createdAt">): Promise<Doctor> {
    const raw = await apiFetch<any>("/doctors/", { method: "POST", body: doctorToApi(input) });
    return doctorFromApi(raw);
  },
  async update(id: string, patch: Partial<Doctor>): Promise<Doctor> {
    const raw = await apiFetch<any>(`/doctors/${id}/`, { method: "PATCH", body: doctorToApi(patch) });
    return doctorFromApi(raw);
  },
  async remove(id: string): Promise<{ ok: true }> {
    await apiFetch(`/doctors/${id}/`, { method: "DELETE" });
    return { ok: true };
  },
};

// ---------- APPOINTMENTS ----------
export const appointmentsApi = {
  async list(): Promise<Appointment[]> {
    const raw = await apiFetchAllPages<any>("/appointments/");
    return raw.map(appointmentFromApi);
  },
  async get(id: string): Promise<Appointment> {
    const raw = await apiFetch<any>(`/appointments/${id}/`);
    return appointmentFromApi(raw);
  },
  async create(input: Omit<Appointment, "id" | "createdAt">): Promise<Appointment> {
    const raw = await apiFetch<any>("/appointments/", { method: "POST", body: appointmentToApi(input) });
    return appointmentFromApi(raw);
  },
  async update(id: string, patch: Partial<Appointment>): Promise<Appointment> {
    const raw = await apiFetch<any>(`/appointments/${id}/`, { method: "PATCH", body: appointmentToApi(patch) });
    return appointmentFromApi(raw);
  },
  async remove(id: string): Promise<{ ok: true }> {
    await apiFetch(`/appointments/${id}/`, { method: "DELETE" });
    return { ok: true };
  },
};

// ---------- MEDICINES ----------
export const medicinesApi = {
  async list(): Promise<Medicine[]> {
    const raw = await apiFetchAllPages<any>("/medicines/");
    return raw.map(medicineFromApi);
  },
  async get(id: string): Promise<Medicine> {
    const raw = await apiFetch<any>(`/medicines/${id}/`);
    return medicineFromApi(raw);
  },
  async create(input: Omit<Medicine, "id" | "createdAt">): Promise<Medicine> {
    const raw = await apiFetch<any>("/medicines/", { method: "POST", body: medicineToApi(input) });
    return medicineFromApi(raw);
  },
  async update(id: string, patch: Partial<Medicine>): Promise<Medicine> {
    const raw = await apiFetch<any>(`/medicines/${id}/`, { method: "PATCH", body: medicineToApi(patch) });
    return medicineFromApi(raw);
  },
  async remove(id: string): Promise<{ ok: true }> {
    await apiFetch(`/medicines/${id}/`, { method: "DELETE" });
    return { ok: true };
  },
};

// ---------- NOTIFICATIONS ----------
export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const raw = await apiFetchAllPages<any>("/notifications/");
    return raw.map(notificationFromApi);
  },
  async markRead(id: string) {
    await apiFetch(`/notifications/${id}/mark_read/`, { method: "POST" });
    return { ok: true };
  },
  async markAllRead() {
    await apiFetch("/notifications/mark_all_read/", { method: "POST" });
    return { ok: true };
  },
  async remove(id: string) {
    await apiFetch(`/notifications/${id}/`, { method: "DELETE" });
    return { ok: true };
  },
};

// ---------- DASHBOARD ----------
export const dashboardApi = {
  async stats(): Promise<DashboardStats> {
    const raw = await apiFetch<any>("/dashboard/stats/");
    return {
      ...raw,
      upcomingAppointments: (raw.upcomingAppointments ?? []).map((a: any) => appointmentFromApi(a)),
    };
  },
};

// ---------- REPORTS ----------
// NOTE: the Django backend does not yet expose a dedicated /reports/ endpoint,
// and there is no revenue/billing model in the current schema, so
// `revenueByMonth` can't be computed from real data yet. This aggregates what
// IS available (appointments + medicines + patients) client-side. Add a
// proper `/api/reports/summary/` endpoint (and a Bill/Invoice model) to
// replace this with real revenue figures later.
export const reportsApi = {
  async summary() {
    const [patients, appointments, medicines] = await Promise.all([
      patientsApi.list(),
      appointmentsApi.list(),
      medicinesApi.list(),
    ]);

    const monthsBack = (i: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d;
    };
    const monthLabel = (d: Date) => d.toLocaleString("default", { month: "short" });

    const stockByCategory = Object.entries(
      medicines.reduce<Record<string, number>>((acc, m) => {
        acc[m.category] = (acc[m.category] ?? 0) + m.quantity;
        return acc;
      }, {}),
    ).map(([category, qty]) => ({ category, qty }));

    const appointmentsByMonth = Array.from({ length: 6 }, (_, idx) => {
      const d = monthsBack(5 - idx);
      const count = appointments.filter((a) => {
        const ad = new Date(a.date);
        return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth();
      }).length;
      return { month: monthLabel(d), count };
    });

    const patientGrowth = Array.from({ length: 6 }, (_, idx) => {
      const d = monthsBack(5 - idx);
      const count = patients.filter((p) => new Date(p.createdAt) <= new Date(d.getFullYear(), d.getMonth() + 1, 0)).length;
      return { month: monthLabel(d), count };
    });

    return {
      revenueByMonth: [] as { month: string; revenue: number }[], // not tracked yet — see note above
      stockByCategory,
      appointmentsByMonth,
      patientGrowth,
    };
  },
};
