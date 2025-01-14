import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  singlesMatchesTable,
  usersEloDiffTable,
  usersTable,
} from "../db/schema";
import { EloDiff } from "../util/elo";
import { GameResultUser, Match } from "./types";

export const createMatch = async (playerOneId: string, playerTwoId: string) => {
  const [match] = await db
    .insert(singlesMatchesTable)
    .values({
      playerOneId,
      playerTwoId,
    })
    .returning();

  return match;
};

export const findCurrentMatchByUserId = async (playerId: string) => {
  const [match] = await db
    .select()
    .from(singlesMatchesTable)
    .where(
      and(
        or(
          eq(singlesMatchesTable.playerOneId, playerId),
          eq(singlesMatchesTable.playerTwoId, playerId)
        ),
        isNull(singlesMatchesTable.result)
      )
    );
  return match;
};

interface FindCurrentMatchReturn {
  match: Match;
  playerOne: GameResultUser;
  playerTwo: GameResultUser;
}

export const findCurrentMatchByUserSlackId = async (
  userSlackId: string
): Promise<{
  match: {
    id: string;
    createdAt: string;
  };
  playerOne: GameResultUser;
  playerTwo: GameResultUser;
}> => {
  const result = await db.execute(sql`
    SELECT
        json_build_object(
          'id', current_match.id,
          'createdAt', current_match.created_at
        ) AS "match",
        json_build_object(
          'id', player_one.id,
          'name', player_one.name,
          'fullName', player_one.name_normalized,
          'elo', player_one.elo
        ) AS "playerOne",
        json_build_object(
          'id', player_two.id,
          'name', player_two.name,
          'fullName', player_two.name_normalized,
          'elo', player_two.elo
        ) AS "playerTwo"
    FROM users u
    LEFT JOIN singles_matches AS current_match
        ON current_match.player_one_id = u.id
        OR current_match.player_two_id = u.id
    LEFT JOIN users AS player_one
        ON current_match.player_one_id = player_one.id
    LEFT JOIN users AS player_two
        ON current_match.player_two_id = player_two.id
    WHERE u.slack_id = ${userSlackId}
      AND current_match.result IS NULL;
  `);

  // @ts-expect-error
  return result.rows[0] as Promise<FindCurrentMatchReturn>;
};

export const completeMatch = async ({
  matchId,
  winner,
  loser,
  result,
  duration,
}: {
  matchId: string;
  winner: {
    id: string;
    diff: EloDiff;
  };
  loser: {
    id: string;
    diff: EloDiff;
  };
  result: string;
  duration: number;
}) => {
  await db.transaction(async (tx) => {
    await tx
      .update(singlesMatchesTable)
      .set({
        winnerId: winner.id,
        result,
        duration: String(duration),
      })
      .where(eq(singlesMatchesTable.id, matchId));

    await tx.insert(usersEloDiffTable).values([
      {
        eloDiff: String(winner.diff.delta),
        matchId,
        userId: winner.id,
      },
      {
        eloDiff: String(loser.diff.delta),
        matchId,
        userId: loser.id,
      },
    ]);

    await db
      .update(usersTable)
      .set({ elo: String(winner.diff.newRating) })
      .where(eq(usersTable.id, winner.id));

    await db
      .update(usersTable)
      .set({ elo: String(loser.diff.newRating) })
      .where(eq(usersTable.id, loser.id));
  });
};

export const ensurePlayersHaveNoActiveMatches = async (
  playerOneId: string,
  playerTwoId: string
) => {
  const result = await db.execute(sql`
    SELECT 1 FROM singles_matches
    WHERE (
      player_one_id = ${playerOneId}
      OR player_one_id = ${playerTwoId}
      AND player_two_id = ${playerTwoId}
      OR player_two_id = ${playerOneId}
    )
    AND result is null
  `);

  return result.rows.length === 0;
};
