/**
 * Converts between Django's snake_case API payloads and the camelCase
 * shapes defined in `@/types`. Keeping this in one place means the rest
 * of the app never has to know the backend uses different field names.
 */
import type { Appointment, Doctor, Medicine, Notification, Patient, User } from "@/types";

// ---------- Patient ----------
export function patientFromApi(raw: any): Patient & { patientCode?: string } {
  return {
    id: raw.id,
    patientCode: raw.patient_code,
    firstName: raw.first_name,
    lastName: raw.last_name,
    email: raw.email ?? "",
    phone: raw.phone,
    gender: raw.gender,
    dob: raw.dob,
    bloodType: raw.blood_type,
    allergies: raw.allergies ?? [],
    address: raw.address ?? "",
    emergencyContactName: raw.emergency_contact_name ?? "",
    emergencyContactPhone: raw.emergency_contact_phone ?? "",
    medicalHistory: (raw.medical_history ?? []).map((h: any) => ({
      date: h.date,
      note: h.note,
      doctorId: h.doctor ?? undefined,
    })),
    createdAt: raw.created_at,
  };
}

export function patientToApi(patient: Partial<Patient>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (patient.firstName !== undefined) body.first_name = patient.firstName;
  if (patient.lastName !== undefined) body.last_name = patient.lastName;
  if (patient.email !== undefined) body.email = patient.email;
  if (patient.phone !== undefined) body.phone = patient.phone;
  if (patient.gender !== undefined) body.gender = patient.gender;
  if (patient.dob !== undefined) body.dob = patient.dob;
  if (patient.bloodType !== undefined) body.blood_type = patient.bloodType;
  if (patient.allergies !== undefined) body.allergies = patient.allergies;
  if (patient.address !== undefined) body.address = patient.address;
  if (patient.emergencyContactName !== undefined) body.emergency_contact_name = patient.emergencyContactName;
  if (patient.emergencyContactPhone !== undefined) body.emergency_contact_phone = patient.emergencyContactPhone;
  return body;
}

// ---------- Doctor ----------
export function doctorFromApi(raw: any): Doctor {
  return {
    id: raw.id,
    firstName: raw.first_name,
    lastName: raw.last_name,
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    department: raw.department,
    specialty: raw.specialty,
    available: raw.available,
    workingHours: {
      start: raw.working_hours?.start ?? "09:00",
      end: raw.working_hours?.end ?? "17:00",
      days: raw.working_hours?.days ?? [],
    },
    bio: raw.bio ?? "",
    createdAt: raw.created_at,
  };
}

export function doctorToApi(doctor: Partial<Doctor>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (doctor.firstName !== undefined) body.first_name = doctor.firstName;
  if (doctor.lastName !== undefined) body.last_name = doctor.lastName;
  if (doctor.email !== undefined) body.email = doctor.email;
  if (doctor.phone !== undefined) body.phone = doctor.phone;
  if (doctor.department !== undefined) body.department = doctor.department;
  if (doctor.specialty !== undefined) body.specialty = doctor.specialty;
  if (doctor.available !== undefined) body.available = doctor.available;
  if (doctor.bio !== undefined) body.bio = doctor.bio;
  if (doctor.workingHours !== undefined) {
    body.working_hours_start = doctor.workingHours.start;
    body.working_hours_end = doctor.workingHours.end;
    body.working_days = doctor.workingHours.days;
  }
  return body;
}

// ---------- Appointment ----------
export function appointmentFromApi(raw: any): Appointment {
  return {
    id: raw.id,
    patientId: raw.patient ?? raw.patientId,
    doctorId: raw.doctor ?? raw.doctorId,
    date: raw.date,
    duration: raw.duration,
    reason: raw.reason,
    notes: raw.notes ?? undefined,
    status: raw.status,
    createdAt: raw.created_at ?? raw.createdAt,
  };
}

export function appointmentToApi(appt: Partial<Appointment>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (appt.patientId !== undefined) body.patient = appt.patientId;
  if (appt.doctorId !== undefined) body.doctor = appt.doctorId;
  if (appt.date !== undefined) body.date = appt.date;
  if (appt.duration !== undefined) body.duration = appt.duration;
  if (appt.reason !== undefined) body.reason = appt.reason;
  if (appt.notes !== undefined) body.notes = appt.notes;
  if (appt.status !== undefined) body.status = appt.status;
  return body;
}

// ---------- Medicine ----------
export function medicineFromApi(raw: any): Medicine & { code?: string } {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    category: raw.category,
    quantity: raw.quantity,
    price: typeof raw.price === "string" ? parseFloat(raw.price) : raw.price,
    supplier: raw.supplier,
    expiryDate: raw.expiry_date,
    reorderLevel: raw.reorder_level,
    createdAt: raw.created_at,
  };
}

export function medicineToApi(med: Partial<Medicine>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (med.name !== undefined) body.name = med.name;
  if (med.category !== undefined) body.category = med.category;
  if (med.quantity !== undefined) body.quantity = med.quantity;
  if (med.price !== undefined) body.price = med.price;
  if (med.supplier !== undefined) body.supplier = med.supplier;
  if (med.expiryDate !== undefined) body.expiry_date = med.expiryDate;
  if (med.reorderLevel !== undefined) body.reorder_level = med.reorderLevel;
  return body;
}

// ---------- Notification ----------
export function notificationFromApi(raw: any): Notification {
  return {
    id: raw.id,
    title: raw.title,
    message: raw.message,
    type: raw.type,
    read: raw.read,
    createdAt: raw.created_at,
  };
}

// ---------- User ----------
export function userFromApi(raw: any): Omit<User, "password"> {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    avatar: raw.avatar ?? undefined,
    phone: raw.phone ?? undefined,
    createdAt: raw.created_at,
  };
}
