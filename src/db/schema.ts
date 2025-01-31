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
  fullName: text("full_name").notNull().unique(),
  slackId: text("slack_id").notNull(),
  slackName: text("slack_name").notNull().unique(),
  email: text("email").notNull(),
  elo: numeric("elo").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .default(sql`current_timestamp`),
});

export const singlesMatchesTable = pgTable("singles_matches", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  playerOneId: uuid("player_one_id")
    .notNull()
    .references(() => usersTable.id),
  playerTwoId: uuid("player_two_id")
    .notNull()
    .references(() => usersTable.id),
  winnerId: uuid("winner_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .default(sql`current_timestamp`),
  result: text("result"),
  duration: numeric("duration"),
});

export const usersEloDiffTable = pgTable(
  "users_elo_diff",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => singlesMatchesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => usersTable.id),
    eloDiff: numeric("elo_diff").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.matchId, table.userId],
    }),
  ]
);
