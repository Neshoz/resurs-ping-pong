import { App } from "@slack/bolt";
import { InvalidCommandError } from "../util/error";
import { USER_MENTION_REGEX } from "../util/regex";
import * as userService from "../services/user-service";
import * as matchService from "../services/match-service";

export const oneVsOneCommand = (app: App) =>
  app.command("/1v1", async ({ ack, command, say, logger }) => {
    try {
      await ack();

      if (!USER_MENTION_REGEX.test(command.text)) {
        throw new InvalidCommandError(
          "Invalid command format, correct format is /1v1 @John Doe"
        );
      }

      const [playerOne, playerTwo] = await Promise.all([
        userService.findUserBySlackName(command.text.substring(1)),
        userService.findUserBySlackId(command.user_id),
      ]);

      if (playerOne.id === playerTwo.id) {
        throw new InvalidCommandError(
          "You cannot start a match with yourself."
        );
      }

      const hasNoActiveMatches =
        await matchService.ensurePlayersHaveNoActiveMatches(
          playerOne.id,
          playerTwo.id
        );

      if (!hasNoActiveMatches) {
        throw new InvalidCommandError(
          "One of the players already have an active match."
        );
      }

      const match = await matchService.createMatch(playerOne.id, playerTwo.id);

      await say(`Match with id ${match.id} started. GLHF.`);
    } catch (error) {
      if (error instanceof InvalidCommandError) {
        await say(error.message);
      } else {
        logger.error((error as Error).message);
        await say("An unexpected error has occurred, please try again later.");
      }
    }
  });
