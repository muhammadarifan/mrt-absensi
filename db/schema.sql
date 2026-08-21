-- Skema database — Sistem Absensi Siswa RFID
-- Target: SQLite (dev/MVP). Portable ke PostgreSQL (ganti AUTOINCREMENT -> SERIAL/IDENTITY, TEXT timestamp -> TIMESTAMPTZ).

CREATE TABLE classes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,                 -- contoh: "6A"
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE students (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id    INTEGER NOT NULL REFERENCES classes(id),
  name        TEXT NOT NULL,
  card_uid    TEXT UNIQUE,                    -- null = belum punya kartu
  photo_url   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_students_class ON students(class_id);

CREATE TABLE devices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,                  -- contoh: "Gerbang Utama"
  api_key     TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Config jam masuk (single-row config table, cukup untuk 1 sekolah)
CREATE TABLE attendance_rules (
  id                INTEGER PRIMARY KEY CHECK (id = 1),  -- selalu 1 baris
  checkin_start     TEXT NOT NULL DEFAULT '06:00',       -- mulai dianggap hadir
  late_after        TEXT NOT NULL DEFAULT '07:00'        -- lewat jam ini = telat
);
INSERT INTO attendance_rules (id, checkin_start, late_after) VALUES (1, '06:00', '07:00');

CREATE TABLE attendance (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id    INTEGER NOT NULL REFERENCES students(id),
  device_id     INTEGER NOT NULL REFERENCES devices(id),
  scanned_at    TEXT NOT NULL DEFAULT (datetime('now')),
  status        TEXT NOT NULL CHECK (status IN ('hadir', 'telat')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
-- 1 siswa cuma boleh 1 catatan absen per hari (tap kedua diabaikan/di-update di app layer)
CREATE UNIQUE INDEX idx_attendance_student_day ON attendance(student_id, date(scanned_at));
CREATE INDEX idx_attendance_date ON attendance(date(scanned_at));

-- Login dashboard (admin/guru)
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'guru')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
