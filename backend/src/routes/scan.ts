import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/client";
import { students, devices, attendance, attendanceRules } from "../db/schema";

export const scanRoute = new Hono();

// POST /api/devices/:device_id/scan  { card_uid }
scanRoute.post("/devices/:device_id/scan", async (c) => {
  const deviceId = Number(c.req.param("device_id"));
  const apiKey = c.req.header("X-Device-Key");
  const { card_uid } = await c.req.json<{ card_uid: string }>();

  const device = await db.query.devices.findFirst({ where: eq(devices.id, deviceId) });
  if (!device || device.apiKey !== apiKey) {
    return c.json({ status: "unauthorized" }, 401);
  }

  const student = await db.query.students.findFirst({ where: eq(students.cardUid, card_uid) });
  if (!student) {
    return c.json({ status: "unknown_card" }, 404);
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

  await db.insert(attendance).values({ studentId: student.id, deviceId, status });
  return c.json({ status: "ok", student_name: student.name, attendance_status: status });
});
