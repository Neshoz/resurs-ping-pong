import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  singlesMatchesTable,
  usersEloDiffTable,
  usersTable,
} from "../db/schema";
import { EloDiff } from "../util/elo";

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

export const findCurrentMatchByUserSlackId = (userSlackId: string) => {
  return db.execute(sql`
    SELECT
        current_match.*,
        json_build_object(
          'id', player_one.id,
          'name', player_one.name,
          'elo', player_one.elo_rank
        ) AS player_one_details,
        json_build_object(
          'id', player_two.id,
          'name', player_two.name,
          'elo', player_two.elo_rank
        ) AS player_two_details
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
};

export const completeMatch = async ({
  matchId,
  winnerId,
  result,
  duration,
  players,
  elo,
}: {
  matchId: string;
  winnerId: string;
  result: string;
  duration: number;
  players: {
    playerOneId: string;
    playerTwoId: string;
  };
  elo: {
    playerOne: EloDiff;
    playerTwo: EloDiff;
  };
}) => {
  await db.transaction(async (tx) => {
    await tx
      .update(singlesMatchesTable)
      .set({
        winnerId,
        result,
        duration: String(duration),
      })
      .where(eq(singlesMatchesTable.id, matchId));

    await tx.insert(usersEloDiffTable).values([
      {
        eloDiff: String(elo.playerOne.delta),
        matchId,
        userId: players.playerOneId,
      },
      {
        eloDiff: String(elo.playerTwo.delta),
        matchId,
        userId: players.playerTwoId,
      },
    ]);

    await db
      .update(usersTable)
      .set({ elo: String(elo.playerOne.newRating) })
      .where(eq(usersTable.id, players.playerOneId));

    await db
      .update(usersTable)
      .set({ elo: String(elo.playerTwo.newRating) })
      .where(eq(usersTable.id, players.playerTwoId));
  });
};

export const ensurePlayersHaveNoActiveMatches = async (
  playerOneId: string,
  playerTwoId: string
) => {
  const result = await db.execute(sql`
    SELECT 1 FROM singles_matches
    WHERE player_one_id = ${playerOneId}
    AND player_two_id = ${playerTwoId}
    AND result is null
  `);

  return result.rows.length === 0;
};
