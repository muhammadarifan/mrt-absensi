import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { attendance } from "../db/schema";

export const attendanceRoute = new Hono();

attendanceRoute.get("/attendance", async (c) => {
  const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);

  const allStudents = await db.query.students.findMany({
    orderBy: (s, { asc }) => asc(s.name),
  });

  const dayRows = await db
    .select()
    .from(attendance)
    .where(sql`date(${attendance.scannedAt}) = ${date}`);

  const byStudent = new Map<number, { hadir: any; pulang: any }>();
  for (const row of dayRows) {
    const entry = byStudent.get(row.studentId) ?? { hadir: null, pulang: null };
    entry[row.type] = row;
    byStudent.set(row.studentId, entry);
  }

  const result = allStudents.map((s) => ({
    student: s,
    hadir: byStudent.get(s.id)?.hadir ?? null,
    pulang: byStudent.get(s.id)?.pulang ?? null,
  }));

  return c.json(result);
});

attendanceRoute.get("/attendance/:student_id/history", async (c) => {
  const studentId = Number(c.req.param("student_id"));
  const rows = await db.query.attendance.findMany({ where: eq(attendance.studentId, studentId) });
  return c.json(rows);
});

attendanceRoute.post("/attendance/manual", async (c) => {
  const { studentId, type, date, time } = await c.req.json<{
    studentId: number;
    type: "hadir" | "pulang";
    date?: string;
    time?: string;
  }>();

  const d = date ?? new Date().toISOString().slice(0, 10);
  const t = time ?? new Date().toTimeString().slice(0, 8);
  const scannedAt = `${d} ${t}`;
  const status = type === "hadir" ? "hadir" : "pulang";

  const existing = await db.query.attendance.findFirst({
    where: and(
      eq(attendance.studentId, studentId),
      eq(attendance.type, type),
      sql`date(scanned_at) = ${d}`
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(attendance)
      .set({ scannedAt, status })
      .where(eq(attendance.id, existing.id))
      .returning();
    return c.json(updated);
  }

  const [created] = await db
    .insert(attendance)
    .values({ studentId, deviceId: null, type, status, scannedAt })
    .returning();
  return c.json(created, 201);
});

attendanceRoute.delete("/attendance/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(attendance).where(eq(attendance.id, id));
  return c.body(null, 204);
});