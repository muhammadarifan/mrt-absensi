// Usage: bun run scripts/seed-admin.ts <email> <password> [name]
import { db } from "../src/db/client";
import { users } from "../src/db/schema";

const [email, password, name = "Admin"] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: bun run scripts/seed-admin.ts <email> <password> [name]");
  process.exit(1);
}

const passwordHash = await Bun.password.hash(password);
await db.insert(users).values({ email, passwordHash, name, role: "admin" });
console.log(`Admin created: ${email}`);
