import { sql } from "drizzle-orm";
import {
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  slackId: uuid("slack_id").notNull(),
  name: text("name").notNull().unique(),
  normalizedName: text("name_normalized").notNull().unique(),
  elo: numeric("elo_rank").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .default(sql`current_timestamp`),
});

export const matchesTable = pgTable("matches", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  playerOneId: uuid("player_one").references(() => usersTable.id),
  playerTwoId: uuid("player_two").references(() => usersTable.id),
  winnerId: uuid("winner_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .default(sql`current_timestamp`),
  duration: numeric("duration"),
});

export const playerEloDiffTable = pgTable(
  "player_elo_diff_table",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => matchesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => usersTable.id),
    eloDiff: numeric("elo_diff").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.matchId, table.userId],
    }),
  ]
);
