import { and, eq, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  doublesMatchesTable,
  doublesUsersEloDiffTable,
  usersTable,
} from "../db/schema";
import { EloDiff } from "../util/elo";
import { DoublesMatch, DoublesMatchStatus, GameResultUser } from "./types";

export const createDoublesMatch = async ({
  initiatorId,
  team1Player1Id,
  team1Player2Id,
  team2Player1Id,
  team2Player2Id,
}: {
  initiatorId: string;
  team1Player1Id: string;
  team1Player2Id: string;
  team2Player1Id: string;
  team2Player2Id: string;
}) => {
  const [match] = await db
    .insert(doublesMatchesTable)
    .values({
      initiatorId,
      team1Player1Id,
      team1Player2Id,
      team2Player1Id,
      team2Player2Id,
      confirmations: [initiatorId], // Initiator is automatically confirmed
    })
    .returning();

  return match;
};

export const findActiveDoublesMatchesByUserId = async (userId: string) => {
  const matches = await db
    .select()
    .from(doublesMatchesTable)
    .where(
      and(
        or(
          eq(doublesMatchesTable.team1Player1Id, userId),
          eq(doublesMatchesTable.team1Player2Id, userId),
          eq(doublesMatchesTable.team2Player1Id, userId),
          eq(doublesMatchesTable.team2Player2Id, userId)
        ),
        or(
          eq(doublesMatchesTable.status, "PENDING_CONFIRMATION"),
          eq(doublesMatchesTable.status, "IN_PROGRESS")
        )
      )
    );

  return matches;
};

export const findInProgressDoublesMatchByInitiator = async (
  initiatorId: string
) => {
  const [match] = await db
    .select()
    .from(doublesMatchesTable)
    .where(
      and(
        eq(doublesMatchesTable.initiatorId, initiatorId),
        eq(doublesMatchesTable.status, "IN_PROGRESS")
      )
    );

  return match;
};

export const addConfirmation = async (matchId: string, userId: string) => {
  const [match] = await db
    .select()
    .from(doublesMatchesTable)
    .where(eq(doublesMatchesTable.id, matchId));

  if (!match) {
    throw new Error("Match not found");
  }

  const updatedConfirmations = [...(match.confirmations || []), userId];

  await db
    .update(doublesMatchesTable)
    .set({ confirmations: updatedConfirmations })
    .where(eq(doublesMatchesTable.id, matchId));

  return updatedConfirmations;
};

export const startDoublesMatch = async (matchId: string) => {
  await db
    .update(doublesMatchesTable)
    .set({
      status: "IN_PROGRESS",
      startedAt: sql`current_timestamp`,
    })
    .where(eq(doublesMatchesTable.id, matchId));
};

export const cancelDoublesMatch = async (
  matchId: string,
  cancelledBy: string
) => {
  await db
    .update(doublesMatchesTable)
    .set({
      status: "CANCELLED",
      cancelledBy,
    })
    .where(eq(doublesMatchesTable.id, matchId));
};

export const completeDoublesMatch = async ({
  matchId,
  winningTeam,
  score,
  team1Player1Diff,
  team1Player2Diff,
  team2Player1Diff,
  team2Player2Diff,
}: {
  matchId: string;
  winningTeam: number;
  score: string;
  team1Player1Diff: { id: string; diff: EloDiff };
  team1Player2Diff: { id: string; diff: EloDiff };
  team2Player1Diff: { id: string; diff: EloDiff };
  team2Player2Diff: { id: string; diff: EloDiff };
}) => {
  await db.transaction(async (tx) => {
    // Update match status
    await tx
      .update(doublesMatchesTable)
      .set({
        status: "COMPLETED",
        winningTeam: String(winningTeam),
        score,
        completedAt: sql`current_timestamp`,
      })
      .where(eq(doublesMatchesTable.id, matchId));

    // Insert ELO diffs
    await tx.insert(doublesUsersEloDiffTable).values([
      {
        matchId,
        userId: team1Player1Diff.id,
        eloDiff: String(team1Player1Diff.diff.delta),
      },
      {
        matchId,
        userId: team1Player2Diff.id,
        eloDiff: String(team1Player2Diff.diff.delta),
      },
      {
        matchId,
        userId: team2Player1Diff.id,
        eloDiff: String(team2Player1Diff.diff.delta),
      },
      {
        matchId,
        userId: team2Player2Diff.id,
        eloDiff: String(team2Player2Diff.diff.delta),
      },
    ]);

    // Update player ELOs
    await Promise.all([
      tx
        .update(usersTable)
        .set({ elo: String(team1Player1Diff.diff.newRating) })
        .where(eq(usersTable.id, team1Player1Diff.id)),
      tx
        .update(usersTable)
        .set({ elo: String(team1Player2Diff.diff.newRating) })
        .where(eq(usersTable.id, team1Player2Diff.id)),
      tx
        .update(usersTable)
        .set({ elo: String(team2Player1Diff.diff.newRating) })
        .where(eq(usersTable.id, team2Player1Diff.id)),
      tx
        .update(usersTable)
        .set({ elo: String(team2Player2Diff.diff.newRating) })
        .where(eq(usersTable.id, team2Player2Diff.id)),
    ]);
  });
};

export const getDoublesMatchWithPlayers = async (matchId: string) => {
  const result = await db.execute(sql`
    SELECT
      dm.*,
      json_build_object(
        'id', t1p1.id,
        'slackId', t1p1.slack_id,
        'slackName', t1p1.slack_name,
        'fullName', t1p1.full_name,
        'elo', t1p1.elo
      ) AS "team1Player1",
      json_build_object(
        'id', t1p2.id,
        'slackId', t1p2.slack_id,
        'slackName', t1p2.slack_name,
        'fullName', t1p2.full_name,
        'elo', t1p2.elo
      ) AS "team1Player2",
      json_build_object(
        'id', t2p1.id,
        'slackId', t2p1.slack_id,
        'slackName', t2p1.slack_name,
        'fullName', t2p1.full_name,
        'elo', t2p1.elo
      ) AS "team2Player1",
      json_build_object(
        'id', t2p2.id,
        'slackId', t2p2.slack_id,
        'slackName', t2p2.slack_name,
        'fullName', t2p2.full_name,
        'elo', t2p2.elo
      ) AS "team2Player2"
    FROM doubles_matches dm
    LEFT JOIN users t1p1 ON dm.team1_player1_id = t1p1.id
    LEFT JOIN users t1p2 ON dm.team1_player2_id = t1p2.id
    LEFT JOIN users t2p1 ON dm.team2_player1_id = t2p1.id
    LEFT JOIN users t2p2 ON dm.team2_player2_id = t2p2.id
    WHERE dm.id = ${matchId}
  `);

  return result.rows[0] as any;
};

export const ensurePlayersHaveNoActiveDoublesMatches = async (
  playerIds: string[]
) => {
  const result = await db.execute(sql`
    SELECT 1 FROM doubles_matches
    WHERE (
      team1_player1_id = ANY(${playerIds})
      OR team1_player2_id = ANY(${playerIds})
      OR team2_player1_id = ANY(${playerIds})
      OR team2_player2_id = ANY(${playerIds})
    )
    AND status IN ('PENDING_CONFIRMATION', 'IN_PROGRESS')
  `);

  return result.rows.length === 0;
};
