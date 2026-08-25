import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

export const leaderboardEntries = mysqlTable("leaderboard_entries", {
  id: int("id").autoincrement().primaryKey(),
  playerName: varchar("playerName", { length: 24 }).notNull().unique(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  draws: int("draws").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const playerProfiles = mysqlTable("player_profiles", {
  id: int("id").autoincrement().primaryKey(),
  playerName: varchar("playerName", { length: 24 }).notNull().unique(),
  avatar: varchar("avatar", { length: 16 }).default("TARGET").notNull(),
  cardColor: varchar("cardColor", { length: 16 }).default("VERMILION").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const matchHistory = mysqlTable("match_history", {
  id: int("id").autoincrement().primaryKey(),
  playerName: varchar("playerName", { length: 24 }).notNull(),
  opponentName: varchar("opponentName", { length: 24 }).notNull(),
  outcome: mysqlEnum("outcome", ["wins", "losses", "draws"]).notNull(),
  gameMode: mysqlEnum("gameMode", ["LOCAL", "AI"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["LOCAL", "EASY", "HARD"]).notNull(),
  seasonKey: varchar("seasonKey", { length: 16 }).default("ARCHIVE").notNull(),
  playedAt: timestamp("playedAt").defaultNow().notNull(),
}, table => [
  index("match_history_player_played_idx").on(table.playerName, table.playedAt),
  index("match_history_played_idx").on(table.playedAt),
  index("match_history_season_idx").on(table.seasonKey, table.playedAt),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type MatchHistoryEntry = typeof matchHistory.$inferSelect;

// TODO: Add your tables here
