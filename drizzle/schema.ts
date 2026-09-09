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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(),
  userId1: varchar("userId1", { length: 64 }).notNull(),
  userId2: varchar("userId2", { length: 64 }).notNull(),
  status: mysqlEnum("friendshipStatus", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const guilds = mysqlTable("guilds", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  tag: varchar("tag", { length: 5 }).notNull().unique(),
  description: text("description"),
  leaderId: varchar("leaderId", { length: 64 }).notNull(),
  reputation: int("reputation").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const guildMembers = mysqlTable("guildMembers", {
  id: int("id").autoincrement().primaryKey(),
  guildId: int("guildId").notNull(),
  userId: varchar("userId", { length: 64 }).notNull().unique(),
  role: mysqlEnum("guildRole", ["leader", "officer", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  senderId: varchar("senderId", { length: 64 }).notNull(),
  senderName: varchar("senderName", { length: 80 }).notNull(),
  content: text("content").notNull(),
  channel: mysqlEnum("chatChannel", ["direct", "party", "global"]).notNull(),
  recipientId: varchar("recipientId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const feedItems = mysqlTable("feedItems", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  userId: varchar("userId", { length: 64 }).notNull(),
  displayName: varchar("displayName", { length: 80 }).notNull(),
  action: mysqlEnum("feedAction", ["match_won", "match_lost", "achievement", "friend_added", "guild_joined"]).notNull(),
  details: text("details"),
  likes: int("likes").default(0).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Friendship = typeof friendships.$inferSelect;
export type GuildRow = typeof guilds.$inferSelect;
export type GuildMemberRow = typeof guildMembers.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
export type FeedItemRow = typeof feedItems.$inferSelect;
