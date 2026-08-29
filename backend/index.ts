import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { authRoute } from "./src/routes/auth";
import { scanRoute } from "./src/routes/scan";
import { studentsRoute } from "./src/routes/students";
import { attendanceRoute } from "./src/routes/attendance";
import { classesRoute } from "./src/routes/classes";
import { devicesRoute } from "./src/routes/devices";
import { attendanceCodeRoute } from "./src/routes/attendanceCode";
import { checkinRoute } from "./src/routes/checkin";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

const app = new Hono();

app.use("/api/*", cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));

app.route("/api", authRoute);
app.route("/api", scanRoute); // pakai X-Device-Key sendiri, bukan JWT
app.route("/api", checkinRoute); // portal siswa publik, otentikasi via kode papan

app.use("/api/students", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/students/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/attendance", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/attendance/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/classes", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/classes/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));
// Perhatikan: /api/devices/:id (bukan /api/devices/*) supaya tidak menimpa
// /api/devices/:device_id/scan milik scanRoute, yang autentikasinya via X-Device-Key.
app.use("/api/devices", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/devices/:id", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/attendance-code", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/attendance-code/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.route("/api", studentsRoute);
app.route("/api", attendanceRoute);
app.route("/api", classesRoute);
app.route("/api", devicesRoute);
app.route("/api", attendanceCodeRoute);

export default app;
