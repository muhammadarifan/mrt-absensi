import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { devices } from "../db/schema";

export const devicesRoute = new Hono();

devicesRoute.get("/devices", async (c) => {
  return c.json(await db.query.devices.findMany());
});

devicesRoute.post("/devices", async (c) => {
  const { name } = await c.req.json<{ name: string }>();
  const apiKey = crypto.randomUUID();
  const [created] = await db.insert(devices).values({ name, apiKey }).returning();
  return c.json(created, 201);
});

devicesRoute.patch("/devices/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const { name } = await c.req.json<{ name: string }>();
  const [updated] = await db.update(devices).set({ name }).where(eq(devices.id, id)).returning();
  return c.json(updated);
});

devicesRoute.delete("/devices/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(devices).where(eq(devices.id, id));
  return c.body(null, 204);
});
