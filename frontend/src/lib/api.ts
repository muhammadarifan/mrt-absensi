const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export function getToken() {
  return localStorage.getItem("token");
}

export type ClassItem = { id: number; name: string; createdAt: string };

export type Student = {
  id: number;
  classId: number;
  name: string;
  cardUid: string | null;
  photoUrl: string | null;
  createdAt: string;
};

export type StudentInput = { name: string; classId: number; cardUid?: string | null };

export type ClassInput = { name: string };

export type DeviceItem = { id: number; name: string; apiKey: string; createdAt: string };

export type DeviceInput = { name: string };

export type PendingScan = { cardUid: string | null; scannedAt?: string };

export type Rules = {
  id: number;
  checkinStart: string;
  lateAfter: string;
  checkoutStart: string;
  checkoutEnd: string;
  manualMode: "auto" | "hadir" | "pulang";
};

export type RulesInput = Partial<Omit<Rules, "id">>;

export type AttendanceEntry = {
  id: number;
  studentId: number;
  deviceId: number | null;
  type: "hadir" | "pulang";
  scannedAt: string;
  status: "hadir" | "telat" | "pulang";
  createdAt: string;
};

export type AttendanceRow = {
  student: Student;
  hadir: AttendanceEntry | null;
  pulang: AttendanceEntry | null;
};

export type ManualAttendanceInput = {
  studentId: number;
  type: "hadir" | "pulang";
  date?: string;
  time?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (res.status === 401 && path !== "/auth/login") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (location.pathname !== "/login") location.href = "/login";
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; name: string; role: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getStudents: () => request<Student[]>("/students"),
  createStudent: (input: StudentInput) =>
    request<Student>("/students", { method: "POST", body: JSON.stringify(input) }),
  updateStudent: (id: number, input: StudentInput) =>
    request<Student>(`/students/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteStudent: (id: number) => request<void>(`/students/${id}`, { method: "DELETE" }),
  getClasses: () => request<ClassItem[]>("/classes"),
  createClass: (input: ClassInput) => request<ClassItem>("/classes", { method: "POST", body: JSON.stringify(input) }),
  updateClass: (id: number, input: ClassInput) =>
    request<ClassItem>(`/classes/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteClass: (id: number) => request<void>(`/classes/${id}`, { method: "DELETE" }),
  getAttendance: (date?: string) => request<AttendanceRow[]>(`/attendance${date ? `?date=${date}` : ""}`),
  createManualAttendance: (input: ManualAttendanceInput) =>
    request<AttendanceEntry>("/attendance/manual", { method: "POST", body: JSON.stringify(input) }),
  deleteAttendance: (id: number) => request<void>(`/attendance/${id}`, { method: "DELETE" }),
  getDevices: () => request<DeviceItem[]>("/devices"),
  createDevice: (input: DeviceInput) =>
    request<DeviceItem>("/devices", { method: "POST", body: JSON.stringify(input) }),
  updateDevice: (id: number, input: DeviceInput) =>
    request<DeviceItem>(`/devices/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteDevice: (id: number) => request<void>(`/devices/${id}`, { method: "DELETE" }),
  getPendingScan: (deviceId: number) => request<PendingScan>(`/devices/${deviceId}/pending-scan`),
  clearPendingScan: (deviceId: number) => request<void>(`/devices/${deviceId}/pending-scan`, { method: "DELETE" }),
  getRules: () => request<Rules>("/rules"),
  updateRules: (input: RulesInput) => request<Rules>("/rules", { method: "PATCH", body: JSON.stringify(input) }),
};