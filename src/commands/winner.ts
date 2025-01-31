import { InvalidCommandError } from "../util/error";
import * as matchService from "../match/match-service";
import { Command } from "./types";
import { createMatchResultAttachment } from "../util/slack";
import { getMatchResult } from "../match/util";
import { MATCH_WINNER_WITH_SCORE_REGEX } from "../util/regex";

export const winner: Command = async ({
  ack,
  say,
  command,
  client,
  logger,
}) => {
  try {
    await ack();

    const regexMatch = command.text.match(MATCH_WINNER_WITH_SCORE_REGEX);

    if (regexMatch === null) {
      throw new InvalidCommandError(
        "Invalid command format, correct format example: /winner @John Doe 3-1"
      );
    }

    /*
    const dm = await client.conversations.open({
      users: command.user_id,
    });

    await client.chat.postMessage({
      channel: dm.channel!.id!,
      text: "This is a text message",
    });
    */

    const [, winnerName, result] = regexMatch;

    console.log(winnerName);

    const { match, playerOne, playerTwo } =
      await matchService.findCurrentMatchByUserSlackId(command.user_id);

    const { winner, loser } = getMatchResult(playerOne, playerTwo, winnerName);

    await matchService.completeMatch({
      matchId: match.id,
      winner,
      loser,
      result,
      duration: Date.now() - new Date(match.createdAt).getTime(),
    });

    await say(createMatchResultAttachment(winner, loser));
  } catch (error) {
    if (error instanceof InvalidCommandError) {
      await say(error.message);
    } else {
      logger.error((error as Error).message);
      await say("An unexpected error has occurred, please try again later.");
    }
  }
};
