# PRD — Sistem Absensi Siswa (RFID)

## 1. Latar Belakang & Tujuan
Sekolah butuh sistem absensi otomatis: siswa tap kartu RFID di reader yang terhubung ke Arduino, data absen tercatat real-time ke sistem, dan guru/wali kelas/orang tua bisa memantau kehadiran.

**Tujuan:**
- Menggantikan absensi manual (kertas/panggil nama).
- Rekap kehadiran otomatis per siswa/kelas/periode.
- Notifikasi keterlambatan/ketidakhadiran (opsional, fase 2).

## 2. Scope
**In scope (MVP):**
- Registrasi siswa & kartu RFID (mapping UID kartu ↔ siswa).
- Endpoint API penerima data tap dari Arduino.
- Pencatatan absen (hadir/telat, berdasarkan jam masuk yang dikonfigurasi).
- Dashboard web: lihat absensi harian, riwayat per siswa, rekap per kelas.
- Manajemen data siswa & kelas (CRUD sederhana).

**Out of scope (fase awal):**
- Absensi wajah/biometrik lain.
- Aplikasi mobile native.
- Integrasi pembayaran SPP dll.

## 3. Arsitektur Singkat
```
[RFID Reader] -> [Arduino/ESP] --HTTP POST--> [API Backend] -> [Database]
                                                      |
                                              [Web Dashboard (Vue + TanStack)]
```

- **Arduino/ESP8266/ESP32** baca UID kartu via modul RFID (RC522/PN532), kirim `POST /api/attendance/scan` berisi `{ card_uid, device_id, timestamp }` ke backend via WiFi.
- **Backend API** validasi UID → cari siswa → catat absensi → balas status ke Arduino (untuk trigger LED/buzzer sukses/gagal).
- **Frontend** pakai Vue 3 + TanStack Query (fetch/cache data) + TanStack Table (tabel absensi/siswa) + TanStack Router (routing) — atau Vue Router kalau tidak mau full TanStack.

## 4. Alur Utama
1. **Registrasi kartu**: Admin tap kartu baru di mode "enroll" → sistem simpan UID → admin assign ke data siswa.
2. **Tap harian**: Siswa tap kartu → Arduino kirim UID+timestamp ke API → backend cek UID terdaftar → catat absen (status hadir/telat sesuai jam cutoff) → Arduino beri feedback (LED hijau/merah, buzzer).
3. **Monitoring**: Guru buka dashboard → lihat siapa sudah absen hari ini, filter per kelas/tanggal, export rekap.

## 5. API Contract (Arduino ↔ Backend)

### `POST /api/devices/:device_id/scan`
Request:
```json
{ "card_uid": "A1B2C3D4", "scanned_at": "2026-08-21T07:05:00Z" }
```
Response (sukses):
```json
{ "status": "ok", "student_name": "Ahmad", "attendance_status": "hadir" }
```
Response (kartu tidak dikenal):
```json
{ "status": "unknown_card" }
```
- Auth: device pakai API key statis per device (header `X-Device-Key`), simpel untuk MVP.
- Device harus punya RTC/NTP sync biar timestamp akurat (atau backend pakai waktu server saat request diterima, lebih simpel — device cukup kirim UID).

### Endpoint dashboard (untuk frontend)
- `GET /api/students` — list & search siswa
- `POST /api/students` / `PATCH /api/students/:id` — CRUD siswa
- `POST /api/students/:id/card` — assign UID kartu ke siswa
- `GET /api/attendance?date=&class_id=` — rekap absensi
- `GET /api/attendance/:student_id/history`

## 6. Data Model (inti)
- **classes**: id, name
- **students**: id, class_id, name, card_uid (nullable, unique), photo_url
- **devices**: id, name, api_key
- **attendance**: id, student_id, device_id, scanned_at, status (hadir/telat) — unique per (student_id, tanggal)
- **attendance_rules**: single-row config, checkin_start & late_after
- **users**: id, name, email, password_hash, role (admin/guru) — login dashboard

Skema DDL lengkap: [db/schema.sql](db/schema.sql)

## 7. Tech Stack
- **Frontend**: Vue 3 + Vite, TanStack Query (data fetching/cache), TanStack Table (tabel data), TanStack Router (opsional, atau Vue Router).
- **Backend**: Hono + Bun, TypeScript end-to-end (satu bahasa dengan frontend, cold-start & response cepat — penting buat balesan ke Arduino).
- **ORM**: Drizzle.
- **DB**: SQLite dulu buat development/MVP (simpel, no setup). Migrasi ke PostgreSQL begitu sistem sudah stabil / mulai dipakai produksi harian (concurrent write lebih aman, gampang scale multi-sekolah). Drizzle schema didesain portable biar migrasi SQLite→Postgres tinggal ganti driver.
- **Hardware**: Arduino Uno/Nano + RC522 (kalau pakai Ethernet shield) atau ESP32/ESP8266 + RC522 (WiFi built-in, lebih simpel untuk kirim HTTP langsung).

## 8. Non-Functional
- Response API scan < 500ms (device nunggu feedback sebelum bunyi buzzer).
- Device offline-tolerant: kalau WiFi putus, opsional simpan di device (buffer) & retry — fase 2, MVP cukup fail-silent + log.
- Data absensi tidak boleh hilang/duplikat (idempotency: 1 siswa 1 status per hari, tap kedua = update bukan insert baru, atau abaikan).

## 9. Fase Pengembangan
- **Fase 1 (MVP)**: CRUD siswa/kelas, assign kartu, endpoint scan, dashboard absensi harian.
- **Fase 2**: Rekap bulanan/export Excel, notifikasi WA/Telegram ke ortu, buffer offline di device.
- **Fase 3**: Multi-sekolah/multi-device management, role-based access (admin/guru/wali kelas).

## 10. Open Questions
- Backend pakai bahasa/framework apa? (default rekomendasi: Node+TS biar align sama Vue/TanStack)
- 1 device untuk seluruh sekolah atau per kelas?
- Perlu notifikasi ke orang tua di fase 1 atau nanti?
