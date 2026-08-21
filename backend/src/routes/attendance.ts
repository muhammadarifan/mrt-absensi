import { Hono } from "hono";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { attendance, students } from "../db/schema";

export const attendanceRoute = new Hono();

// GET /api/attendance?date=YYYY-MM-DD&class_id=1
attendanceRoute.get("/attendance", async (c) => {
  const date = c.req.query("date");
  const rows = await db
    .select()
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .where(date ? sql`date(${attendance.scannedAt}) = ${date}` : undefined);
  return c.json(rows);
});

attendanceRoute.get("/attendance/:student_id/history", async (c) => {
  const studentId = Number(c.req.param("student_id"));
  const rows = await db.query.attendance.findMany({ where: eq(attendance.studentId, studentId) });
  return c.json(rows);
});
