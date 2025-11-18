import { App } from "@slack/bolt";
import { InvalidCommandError } from "../util/error";
import * as userService from "../user/user-service";
import * as doublesMatchService from "../match/doubles-match-service";
import { sendDM } from "../util/slack";
import { Command } from "./types";

const DOUBLES_COMMAND_REGEX =
  /^<@([^|>]+)\|[^>]+>\s+<@([^|>]+)\|[^>]+>\s+vs\s+<@([^|>]+)\|[^>]+>\s+<@([^|>]+)\|[^>]+>$/i;

export const twoVsTwoCommand: Command = async ({
  ack,
  command,
  client,
  say,
  logger,
}) => {
  try {
    await ack();

    const text = command.text.trim();

    // Parse the command text to extract user mentions
    const matches = text.match(DOUBLES_COMMAND_REGEX);

    if (!matches) {
      throw new InvalidCommandError(
        "Invalid command format. Use: `/pp-2v2 @player1 @player2 vs @player3 @player4`"
      );
    }

    const [, player1Id, player2Id, player3Id, player4Id] = matches;
    const mentionedUserIds = [player1Id, player2Id, player3Id, player4Id];

    // Validate we have exactly 4 unique players
    if (mentionedUserIds.some((id) => !id)) {
      throw new InvalidCommandError("You must mention exactly 4 players.");
    }

    const uniqueUserIds = [...new Set(mentionedUserIds)];
    if (uniqueUserIds.length !== 4) {
      throw new InvalidCommandError("Each player can only be mentioned once.");
    }

    // Validate that the initiator is one of the 4 players
    if (!mentionedUserIds.includes(command.user_id)) {
      throw new InvalidCommandError(
        "You must be one of the 4 players in the match."
      );
    }

    // Get all users from the database
    const users = await Promise.all(
      mentionedUserIds.map((slackId) => userService.findUserBySlackId(slackId))
    );

    // Check if any players have active matches
    const hasNoActiveMatches =
      await doublesMatchService.ensurePlayersHaveNoActiveDoublesMatches(
        users.map((user) => user.id)
      );

    if (!hasNoActiveMatches) {
      throw new InvalidCommandError(
        "One or more players already have an active match."
      );
    }

    // Create the match
    const initiator = users.find((user) => user.slackId === command.user_id)!;
    const match = await doublesMatchService.createDoublesMatch({
      initiatorId: initiator.id,
      team1Player1Id: users[0].id,
      team1Player2Id: users[1].id,
      team2Player1Id: users[2].id,
      team2Player2Id: users[3].id,
    });

    // Send confirmation DMs to non-initiating players
    const nonInitiators = users.filter((user) => user.id !== initiator.id);

    const confirmationPromises = nonInitiators.map(async (player) => {
      const messageBlocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${initiator.slackId}> has challenged you to a 2v2 ping pong match!\n\n*Teams:*\nTeam 1: <@${users[0].slackId}>, <@${users[1].slackId}>\nTeam 2: <@${users[2].slackId}>, <@${users[3].slackId}>\n\nDo you accept?`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Accept",
              },
              style: "primary",
              action_id: "accept_2v2_challenge",
              value: match.id,
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Decline",
              },
              style: "danger",
              action_id: "decline_2v2_challenge",
              value: match.id,
            },
          ],
        },
      ];

      return sendDM(player.slackId, {
        text: `2v2 Challenge from ${initiator.fullName}`,
        blocks: messageBlocks,
      });
    });

    await Promise.all(confirmationPromises);

    // Send confirmation to initiator
    await sendDM(initiator.slackId, {
      text: `2v2 challenge sent! Waiting for confirmations from the other players.`,
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

export const twoVsTwoCommandHandler = (app: App) =>
  app.command("/pp-2v2", twoVsTwoCommand);
