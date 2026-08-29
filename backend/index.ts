import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { attendanceRoute } from "./src/routes/attendance";
import { authRoute } from "./src/routes/auth";
import { classesRoute } from "./src/routes/classes";
import { devicesRoute } from "./src/routes/devices";
import { rulesRoute } from "./src/routes/rules";
import { scanRoute } from "./src/routes/scan";
import { studentsRoute } from "./src/routes/students";
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
app.use("/api/devices", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/devices/:id", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/devices/:id/pending-scan", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/rules", jwt({ secret: JWT_SECRET, alg: "HS256" }));

app.use("/api/attendance-code", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/attendance-code/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.route("/api", studentsRoute);
app.route("/api", attendanceRoute);
app.route("/api", classesRoute);
app.route("/api", devicesRoute);
app.route("/api", rulesRoute);
app.route("/api", attendanceCodeRoute);

export default app;