import { App } from "@slack/bolt";
import { InvalidCommandError } from "../util/error";
import { USER_MENTION_REGEX } from "../util/regex";
import * as userService from "../user/user-service";
import * as matchService from "../match/match-service";
import { askToChallenge, deleteDM, sendDM } from "../util/slack";
import { emitter } from "../util/events";

export const oneVsOneCommand = (app: App) =>
  app.command("/1v1", async ({ ack, command, client, say, logger }) => {
    try {
      await ack();

      if (!USER_MENTION_REGEX.test(command.text)) {
        throw new InvalidCommandError(
          "Invalid command format, correct format is /1v1 @John Doe"
        );
      }

      const [reciever, challenger] = await Promise.all([
        userService.findUserBySlackName(command.text.substring(1)),
        userService.findUserBySlackId(command.user_id),
      ]);

      if (reciever.id === challenger.id) {
        throw new InvalidCommandError(
          "You cannot start a match with yourself."
        );
      }

      const hasNoActiveMatches =
        await matchService.ensurePlayersHaveNoActiveMatches(
          reciever.id,
          challenger.id
        );

      if (!hasNoActiveMatches) {
        throw new InvalidCommandError(
          "One of the players already have an active match."
        );
      }

      const resp = await sendDM(reciever.slackId, {
        text: `Challenge from${challenger.fullName}`,
        blocks: askToChallenge(reciever, challenger),
      });

      emitter.on("dmSent", () => {
        deleteDM(resp.channel!, resp.ts!);
      });

      await sendDM(challenger.slackId, {
        text: `Challenge sent to <@${reciever.slackId}>`,
      });
    } catch (error) {
      if (error instanceof InvalidCommandError) {
        await say(error.message);
      } else {
        logger.error((error as Error).message);
        await say("An unexpected error has occurred, please try again later.");
      }
    }
  });
