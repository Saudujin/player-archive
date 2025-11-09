import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Players table
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  nameArabic: varchar("nameArabic", { length: 255 }).notNull(),
  nameEnglish: varchar("nameEnglish", { length: 255 }).notNull(),
  alternativeNames: text("alternativeNames"), // JSON array of alternative names
  keywords: text("keywords"), // JSON array of keywords
  coverImageUrl: text("coverImageUrl"),
  coverImageKey: varchar("coverImageKey", { length: 512 }),
  teamName: varchar("teamName", { length: 255 }),
  position: varchar("position", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Player images/gallery table
 */
export const playerImages = mysqlTable("playerImages", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  thumbnailKey: varchar("thumbnailKey", { length: 512 }),
  caption: text("caption"),
  isUpscaled: boolean("isUpscaled").default(false),
  originalImageId: int("originalImageId"), // Reference to original image if this is upscaled version
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  uploadedBy: int("uploadedBy"), // Nullable - may not have user context
});

export type PlayerImage = typeof playerImages.$inferSelect;
export type InsertPlayerImage = typeof playerImages.$inferInsert;

/**
 * Vector logos table
 */
export const vectorLogos = mysqlTable("vectorLogos", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  originalImageId: int("originalImageId").notNull(),
  svgUrl: text("svgUrl").notNull(),
  svgKey: varchar("svgKey", { length: 512 }).notNull(),
  pdfUrl: text("pdfUrl"),
  pdfKey: varchar("pdfKey", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
});

export type VectorLogo = typeof vectorLogos.$inferSelect;
export type InsertVectorLogo = typeof vectorLogos.$inferInsert;
/**
 * Admins table for username/password authentication
 */
export const admins = mysqlTable("admins", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // bcrypt hashed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;
