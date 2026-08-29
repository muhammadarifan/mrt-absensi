import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { attendanceRules } from "../db/schema";
import { getOrCreateRules } from "../lib/rules";

export const rulesRoute = new Hono();

rulesRoute.get("/rules", async (c) => {
  return c.json(await getOrCreateRules());
});

rulesRoute.patch("/rules", async (c) => {
  const body = await c.req.json<
    Partial<{
      checkinStart: string;
      lateAfter: string;
      checkoutStart: string;
      checkoutEnd: string;
      manualMode: "auto" | "hadir" | "pulang";
    }>
  >();

  await getOrCreateRules();

  const [updated] = await db
    .update(attendanceRules)
    .set(body)
    .where(eq(attendanceRules.id, 1))
    .returning();

  return c.json(updated);
});