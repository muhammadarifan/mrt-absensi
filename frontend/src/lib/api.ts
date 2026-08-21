const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export function getToken() {
  return localStorage.getItem("token");
}

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
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; name: string; role: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getStudents: () => request<any[]>("/students"),
  getAttendance: (date?: string) => request<any[]>(`/attendance${date ? `?date=${date}` : ""}`),
};
