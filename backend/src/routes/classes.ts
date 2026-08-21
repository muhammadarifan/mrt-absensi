import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { classes } from "../db/schema";

export const classesRoute = new Hono();

classesRoute.get("/classes", async (c) => {
  return c.json(await db.query.classes.findMany());
});

classesRoute.post("/classes", async (c) => {
  const body = await c.req.json();
  const [created] = await db.insert(classes).values(body).returning();
  return c.json(created, 201);
});

classesRoute.patch("/classes/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const [updated] = await db.update(classes).set(body).where(eq(classes.id, id)).returning();
  return c.json(updated);
});

classesRoute.delete("/classes/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(classes).where(eq(classes.id, id));
  return c.body(null, 204);
});
