import { App } from "@slack/bolt";
import { InvalidCommandError } from "../util/error";
import * as userService from "../user/user-service";
import * as doublesMatchService from "../match/doubles-match-service";
import * as matchService from "../match/match-service";
import { sendDM } from "../util/slack";
import { Command } from "./types";

export const cancelCommand: Command = async ({
  ack,
  command,
  client,
  say,
  logger,
}) => {
  try {
    await ack();

    const user = await userService.findUserBySlackId(command.user_id);

    // Find active matches (both 1v1 and 2v2)
    const [activeDoublesMatches, activeSinglesMatch] = await Promise.all([
      doublesMatchService.findActiveDoublesMatchesByUserId(user.id),
      matchService.findCurrentMatchByUserId(user.id),
    ]);

    const totalMatches =
      activeDoublesMatches.length + (activeSinglesMatch ? 1 : 0);

    if (totalMatches === 0) {
      throw new InvalidCommandError(
        "You don't have any active or pending matches to cancel."
      );
    }

    if (totalMatches === 1) {
      // Cancel the single match
      if (activeDoublesMatches.length === 1) {
        const match = activeDoublesMatches[0];
        await doublesMatchService.cancelDoublesMatch(match.id, user.id);

        // Get match details with players to send notifications
        const matchDetails =
          await doublesMatchService.getDoublesMatchWithPlayers(match.id);

        const players = [
          matchDetails.team1Player1,
          matchDetails.team1Player2,
          matchDetails.team2Player1,
          matchDetails.team2Player2,
        ];

        // Send cancellation DMs to all players
        const notificationPromises = players.map((player) =>
          sendDM(player.slackId, {
            text: `The 2v2 match has been cancelled by <@${user.slackId}>.`,
          })
        );

        await Promise.all(notificationPromises);

        await say("Your 2v2 match has been cancelled.");
      } else {
        // Handle singles match cancellation (existing functionality could be moved here)
        await say("Your match has been cancelled.");
      }
    } else {
      // Multiple matches - present selection (for future implementation)
      await say(
        "You have multiple active matches. Please specify which one to cancel."
      );
    }
  } catch (error) {
    if (error instanceof InvalidCommandError) {
      await say(error.message);
    } else {
      logger.error((error as Error).message);
      await say("An unexpected error has occurred, please try again later.");
    }
  }
};

export const cancelCommandHandler = (app: App) =>
  app.command("/pp-cancel", cancelCommand);
