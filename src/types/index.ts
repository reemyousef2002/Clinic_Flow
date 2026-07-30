export type Role = "admin" | "doctor" | "receptionist";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export type Gender = "male" | "female" | "other";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: string;
  bloodType: BloodType;
  allergies: string[];
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalHistory: { date: string; note: string; doctorId?: string }[];
  createdAt: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  specialty: string;
  available: boolean;
  workingHours: { start: string; end: string; days: string[] };
  bio?: string;
  createdAt: string;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // ISO
  duration: number; // minutes
  reason: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  supplier: string;
  expiryDate: string;
  reorderLevel: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "password">;
}

export interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  totalDoctors: number;
  totalMedicines: number;
  lowStock: number;
  expiringSoon: number;
  upcomingAppointments: Appointment[];
  patientGrowth: { month: string; count: number }[];
  appointmentsByStatus: { status: string; count: number }[];
  activity: { id: string; message: string; time: string }[];
}
