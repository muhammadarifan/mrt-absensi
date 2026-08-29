import { Hono } from "hono";
import { desc } from "drizzle-orm";
import { db } from "../db/client";
import { attendanceCodes } from "../db/schema";

export const attendanceCodeRoute = new Hono();

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// GET /api/attendance-code -> kode aktif (baris terbaru), atau null jika belum pernah dibuat
attendanceCodeRoute.get("/attendance-code", async (c) => {
  const latest = await db.query.attendanceCodes.findFirst({ orderBy: desc(attendanceCodes.id) });
  return c.json(latest ?? null);
});

// POST /api/attendance-code/generate -> buat kode baru, kode lama otomatis tidak berlaku
attendanceCodeRoute.post("/attendance-code/generate", async (c) => {
  const [created] = await db.insert(attendanceCodes).values({ code: randomCode() }).returning();
  return c.json(created, 201);
});
