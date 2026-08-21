import { Hono } from "hono";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";

export const authRoute = new Hono();

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

authRoute.post("/auth/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
    return c.json({ error: "Email atau password salah" }, 401);
  }

  const token = await sign(
    { sub: user.id, name: user.name, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
    JWT_SECRET
  );

  return c.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});
