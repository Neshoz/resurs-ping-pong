import { EloDiff, getNextPlayerElo } from "../util/elo";
import { GameResultUser } from "./types";

type PlayerWithDiff = GameResultUser & { diff: EloDiff };

type GetMatchResultReturn = {
  winner: PlayerWithDiff;
  loser: PlayerWithDiff;
};

export const getMatchResult = (
  playerOne: GameResultUser,
  playerTwo: GameResultUser,
  winnerName: string
): GetMatchResultReturn => {
  const playerOneEloDiff = getNextPlayerElo(
    Number(playerOne.elo),
    Number(playerTwo.elo),
    winnerName === playerOne.slackName ? 1 : 0
  );

  const playerTwoEloDiff = getNextPlayerElo(
    Number(playerTwo.elo),
    Number(playerOne.elo),
    winnerName === playerTwo.slackName ? 1 : 0
  );

  Object.assign(playerOne, { diff: playerOneEloDiff });
  Object.assign(playerTwo, { diff: playerTwoEloDiff });

  console.log({ playerOne, playerTwo });

  return (
    playerOneEloDiff.delta > 0
      ? { winner: playerOne, loser: playerTwo }
      : { winner: playerTwo, loser: playerOne }
  ) as GetMatchResultReturn;
};
