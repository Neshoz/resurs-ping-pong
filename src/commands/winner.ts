import { InvalidCommandError } from "../util/error";
import * as userService from "../services/user-service";
import * as matchService from "../services/match-service";
import { Command } from "./types";
import { getNextPlayerElo } from "../util/elo";

export const winner: Command = async ({ ack, say, command, logger }) => {
  try {
    await ack();

    /*
    if (!MATCH_WINNER_WITH_SCORE_REGEX.test(command.text)) {
      throw new InvalidCommandError(
        "Invalid command format, correct format example: /winner @John Doe 3-1"
      );
    }
    */

    const [winnerName, result] = command.text.split(" ");

    const winner = await userService.findUserBySlackName(
      winnerName.substring(1)
    );

    const match = await matchService.findCurrentMatchByUserId(winner.id);

    const [playerOne, playerTwo] = await userService.findUsersById(
      match.playerOneId,
      match.playerTwoId
    );

    const playerOneEloDiff = getNextPlayerElo(
      Number(playerOne.elo),
      Number(playerTwo.elo),
      winner.id === playerOne.id ? 1 : 0
    );

    const playerTwoEloDiff = getNextPlayerElo(
      Number(playerTwo.elo),
      Number(playerOne.elo),
      winner.id === playerTwo.id ? 1 : 0
    );

    const duration = Date.now() - new Date(match.createdAt).getTime();

    await matchService.completeMatch({
      matchId: match.id,
      winnerId: winner.id,
      result,
      duration,
      elo: {
        playerOne: playerOneEloDiff,
        playerTwo: playerTwoEloDiff,
      },
      players: {
        playerOneId: playerOne.id,
        playerTwoId: playerTwo.id,
      },
    });

    const playerOneWithEloDiff = {
      ...playerOne,
      diff: playerOneEloDiff,
    };

    const playerTwoWithEloDiff = {
      ...playerTwo,
      diff: playerTwoEloDiff,
    };

    const loser =
      playerOne.id === winner.id ? playerTwoWithEloDiff : playerOneWithEloDiff;

    const winnerWithEloDiff =
      loser.id === playerOne.id ? playerTwoWithEloDiff : playerOneWithEloDiff;

    await say({
      attachments: [
        {
          title: "Match completed!",
          text: "Match completed!",
          fields: [
            {
              title: "Winner",
              value: `${winnerWithEloDiff.normalizedName}, Elo: ${winnerWithEloDiff.diff.newRating} (${winnerWithEloDiff.diff.delta})`,
            },
            {
              title: "Loser",
              value: `${loser.normalizedName}, Elo: ${loser.diff.newRating} (${loser.diff.delta})`,
            },
          ],
        },
      ],
    });
  } catch (error) {
    if (error instanceof InvalidCommandError) {
      await say(error.message);
    } else {
      logger.error((error as Error).message);
      await say("An unexpected error has occurred, please try again later.");
    }
  }
};
