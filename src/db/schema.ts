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

export const doublesMatchesTable = pgTable("doubles_matches", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  matchType: text("match_type").notNull().default("2v2"),
  initiatorId: uuid("initiator_id")
    .notNull()
    .references(() => usersTable.id),
  team1Player1Id: uuid("team1_player1_id")
    .notNull()
    .references(() => usersTable.id),
  team1Player2Id: uuid("team1_player2_id")
    .notNull()
    .references(() => usersTable.id),
  team2Player1Id: uuid("team2_player1_id")
    .notNull()
    .references(() => usersTable.id),
  team2Player2Id: uuid("team2_player2_id")
    .notNull()
    .references(() => usersTable.id),
  status: text("status").notNull().default("PENDING_CONFIRMATION"),
  confirmations: text("confirmations").array().notNull().default([]),
  winningTeam: numeric("winning_team"),
  score: text("score"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .default(sql`current_timestamp`),
  startedAt: timestamp("started_at", {
    withTimezone: true,
    mode: "string",
  }),
  completedAt: timestamp("completed_at", {
    withTimezone: true,
    mode: "string",
  }),
  cancelledBy: uuid("cancelled_by").references(() => usersTable.id),
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

export const doublesUsersEloDiffTable = pgTable(
  "doubles_users_elo_diff",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => doublesMatchesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => usersTable.id),
    eloDiff: numeric("elo_diff").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.matchId, table.userId],
    }),
  ]
);
