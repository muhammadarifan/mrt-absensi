import { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { attendance, attendanceCodes, attendanceRules, students } from "../db/schema";

export const checkinRoute = new Hono();

// Endpoint publik untuk portal siswa (kiosk, tanpa login) — pilih kelas/nama lalu ketik kode papan.
checkinRoute.get("/checkin/classes", async (c) => {
  return c.json(await db.query.classes.findMany());
});

checkinRoute.get("/checkin/students", async (c) => {
  const classId = Number(c.req.query("class_id"));
  const rows = await db.query.students.findMany({ where: eq(students.classId, classId) });
  return c.json(rows.map((s) => ({ id: s.id, name: s.name })));
});

checkinRoute.post("/checkin", async (c) => {
  const { student_id, code } = await c.req.json<{ student_id: number; code: string }>();

  const active = await db.query.attendanceCodes.findFirst({ orderBy: desc(attendanceCodes.id) });
  if (!active || active.code !== code?.trim().toUpperCase()) {
    return c.json({ status: "invalid_code" }, 401);
  }

  const student = await db.query.students.findFirst({ where: eq(students.id, student_id) });
  if (!student) {
    return c.json({ status: "unknown_student" }, 404);
  }

  const rule = await db.query.attendanceRules.findFirst({ where: eq(attendanceRules.id, 1) });
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);
  const status = rule && hhmm > rule.lateAfter ? "telat" : "hadir";

  const existing = await db.query.attendance.findFirst({
    where: and(eq(attendance.studentId, student.id), sql`date(scanned_at) = date('now')`),
  });
  if (existing) {
    return c.json({ status: "ok", student_name: student.name, attendance_status: existing.status });
  }

  await db.insert(attendance).values({ studentId: student.id, deviceId: null, status });
  return c.json({ status: "ok", student_name: student.name, attendance_status: status });
});
