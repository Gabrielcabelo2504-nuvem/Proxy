import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  clientName: varchar("clientName", { length: 160 }).notNull(),
  authorizedIp: varchar("authorizedIp", { length: 64 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  expiresAt: timestamp("expiresAt"),
  lastAccessAt: timestamp("lastAccessAt"),
  createdBy: int("createdBy"),
  resellerId: int("resellerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const resellers = mysqlTable("resellers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const keyActivityLogs = mysqlTable("key_activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  apiKeyId: int("apiKeyId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  previousIp: varchar("previousIp", { length: 64 }),
  newIp: varchar("newIp", { length: 64 }),
  actorIp: varchar("actorIp", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type KeyActivityLog = typeof keyActivityLogs.$inferSelect;
export type InsertKeyActivityLog = typeof keyActivityLogs.$inferInsert;
export type Reseller = typeof resellers.$inferSelect;
export type InsertReseller = typeof resellers.$inferInsert;
