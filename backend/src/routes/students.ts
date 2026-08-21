import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { students } from "../db/schema";

export const studentsRoute = new Hono();

studentsRoute.get("/students", async (c) => {
  return c.json(await db.query.students.findMany());
});

studentsRoute.post("/students", async (c) => {
  const body = await c.req.json();
  const [created] = await db.insert(students).values(body).returning();
  return c.json(created, 201);
});

studentsRoute.patch("/students/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const [updated] = await db.update(students).set(body).where(eq(students.id, id)).returning();
  return c.json(updated);
});

studentsRoute.post("/students/:id/card", async (c) => {
  const id = Number(c.req.param("id"));
  const { card_uid } = await c.req.json<{ card_uid: string }>();
  const [updated] = await db.update(students).set({ cardUid: card_uid }).where(eq(students.id, id)).returning();
  return c.json(updated);
});
