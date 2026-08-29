import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { attendance, devices, students } from "../db/schema";
import { getOrCreateRules } from "../lib/rules";
import { setPendingScan } from "../state/pendingScans";

export const scanRoute = new Hono();

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
    setPendingScan(deviceId, card_uid);
    return c.json({ status: "unknown_card" }, 404);
  }

  const rule = await getOrCreateRules();
  const hhmm = new Date().toTimeString().slice(0, 5);

  const type: "hadir" | "pulang" =
    rule.manualMode === "hadir" || rule.manualMode === "pulang"
      ? rule.manualMode
      : hhmm >= rule.checkoutStart
        ? "pulang"
        : "hadir";

  const status = type === "hadir" ? (hhmm > rule.lateAfter ? "telat" : "hadir") : "pulang";

  const existing = await db.query.attendance.findFirst({
    where: and(
      eq(attendance.studentId, student.id),
      eq(attendance.type, type),
      sql`date(scanned_at) = date('now')`
    ),
  });
  if (existing) {
    return c.json({ status: "ok", student_name: student.name, attendance_status: existing.status, type });
  }

  await db.insert(attendance).values({ studentId: student.id, deviceId, type, status });
  return c.json({ status: "ok", student_name: student.name, attendance_status: status, type });
});