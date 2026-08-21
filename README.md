# Sistem Absensi Siswa (RFID)

Absensi siswa otomatis via tap kartu RFID di Arduino/ESP32, tercatat real-time ke dashboard web.

Detail lengkap: [PRD.md](PRD.md) · Skema database: [db/schema.sql](db/schema.sql)

## Stack
- **Backend**: Hono + Bun + Drizzle ORM + SQLite
- **Frontend**: Vue 3 + Vite + TanStack Query/Table + vue-router
- **Hardware**: Arduino/ESP32 + RFID reader (RC522), kirim tap ke backend via HTTP

## Struktur
```
backend/    API: auth, scan (endpoint Arduino), students, attendance
frontend/   Dashboard: login, absensi harian, data siswa
db/         Skema SQL
```

## Menjalankan

### Backend
```bash
cd backend
bun install
bun run db:push --force        # buat/sync tabel
bun run scripts/seed-admin.ts admin@sekolah.id secret123   # buat akun admin pertama
bun run dev                    # http://localhost:3000
```

### Frontend
```bash
cd frontend
bun install
bun run dev                    # http://localhost:5173
```

Login dashboard pakai akun yang dibuat lewat `seed-admin.ts`.

## Env
- `JWT_SECRET` (backend) — secret buat sign token login, wajib diganti di produksi.
- `WEB_ORIGIN` (backend) — origin frontend yang diizinkan CORS, default `http://localhost:5173`.
- `DB_FILE` (backend) — path file SQLite, default `attendance.db`.
- `VITE_API_URL` (frontend) — base URL backend, default `http://localhost:3000/api`.
