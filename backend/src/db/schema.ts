import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const classes = sqliteTable("classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").notNull().references(() => classes.id),
  name: text("name").notNull(),
  cardUid: text("card_uid").unique(),
  photoUrl: text("photo_url"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const devices = sqliteTable("devices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  apiKey: text("api_key").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const attendanceRules = sqliteTable("attendance_rules", {
  id: integer("id").primaryKey(),
  checkinStart: text("checkin_start").notNull().default("06:00"),
  lateAfter: text("late_after").notNull().default("07:00"),
  checkoutStart: text("checkout_start").notNull().default("15:00"),
  checkoutEnd: text("checkout_end").notNull().default("17:00"),
  manualMode: text("manual_mode", { enum: ["auto", "hadir", "pulang"] }).notNull().default("auto"),
});

export const attendance = sqliteTable(
  "attendance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id").notNull().references(() => students.id),
    deviceId: integer("device_id").references(() => devices.id),
    type: text("type", { enum: ["hadir", "pulang"] }).notNull().default("hadir"),
    scannedAt: text("scanned_at").notNull().default(sql`(datetime('now'))`),
    status: text("status", { enum: ["hadir", "telat", "pulang"] }).notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("idx_attendance_student_day_type").on(
      table.studentId,
      sql`date(${table.scannedAt})`,
      table.type
    ),
  ]
);

export const attendanceCodes = sqliteTable("attendance_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "guru"] }).notNull().default("admin"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});