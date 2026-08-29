import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { attendanceRules } from "../db/schema";

export async function getOrCreateRules() {
  let rule = await db.query.attendanceRules.findFirst({ where: eq(attendanceRules.id, 1) });
  if (!rule) {
    [rule] = await db.insert(attendanceRules).values({ id: 1 }).returning();
  }
  return rule;
}