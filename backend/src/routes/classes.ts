import { Hono } from "hono";
import { db } from "../db/client";

export const classesRoute = new Hono();

classesRoute.get("/classes", async (c) => {
  return c.json(await db.query.classes.findMany());
});
