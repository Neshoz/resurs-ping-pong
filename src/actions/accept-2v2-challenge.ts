import { App } from "@slack/bolt";
import * as doublesMatchService from "../match/doubles-match-service";
import { sendDM } from "../util/slack";

export const accept2v2ChallengeAction = (app: App) =>
  app.action("accept_2v2_challenge", async ({ ack, body, client, logger }) => {
    try {
      await ack();

      if (body.type !== "block_actions") return;

      const userId = body.user.id;
      const action = body.actions[0];
      const matchId = action.type === "button" ? action.value : "";

      if (!matchId) {
        await client.chat.postMessage({
          channel: userId,
          text: "Invalid match ID.",
        });
        return;
      }

      // Get the match details
      const matchDetails = await doublesMatchService.getDoublesMatchWithPlayers(
        matchId
      );

      if (!matchDetails || matchDetails.status !== "PENDING_CONFIRMATION") {
        await client.chat.postMessage({
          channel: userId,
          text: "This match is no longer available for confirmation.",
        });
        return;
      }

      // Add confirmation
      const updatedConfirmations = await doublesMatchService.addConfirmation(
        matchId,
        userId
      );

      const allPlayers = [
        matchDetails.team1Player1,
        matchDetails.team1Player2,
        matchDetails.team2Player1,
        matchDetails.team2Player2,
      ];

      // Check if all players have confirmed (4 total confirmations)
      if (updatedConfirmations.length === 4) {
        // Start the match
        await doublesMatchService.startDoublesMatch(matchId);

        // Send notifications to all players that match is ready
        const matchReadyPromises = allPlayers.map((player) =>
          sendDM(player.slackId, {
            text: `Your 2v2 match is ready to begin!\n\n*Teams:*\nTeam 1: <@${
              matchDetails.team1Player1.slackId
            }>, <@${matchDetails.team1Player2.slackId}>\nTeam 2: <@${
              matchDetails.team2Player1.slackId
            }>, <@${matchDetails.team2Player2.slackId}>\n\n${
              player.id === matchDetails.initiatorId
                ? 'When the match is complete, DM me the result in this format:\n"Team 1 won 21-15" or "Team 2 won 21-18"'
                : "The initiator will report the match result when complete."
            }`,
          })
        );

        await Promise.all(matchReadyPromises);
      } else {
        // Send confirmation to the accepting player
        await client.chat.postMessage({
          channel: userId,
          text: `You've accepted the 2v2 challenge! Waiting for ${
            4 - updatedConfirmations.length
          } more confirmation(s).`,
        });
      }

      // Update the original message to show acceptance
      await client.chat.update({
        channel: body.channel?.id!,
        ts: body.message?.ts!,
        text: "Challenge accepted!",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "✅ You have accepted this 2v2 challenge!",
            },
          },
        ],
      });
    } catch (error) {
      logger.error(
        `Error accepting 2v2 challenge: ${(error as Error).message}`
      );
      await client.chat.postMessage({
        channel: body.user.id,
        text: "An error occurred while accepting the challenge. Please try again.",
      });
    }
  });

export const decline2v2ChallengeAction = (app: App) =>
  app.action("decline_2v2_challenge", async ({ ack, body, client, logger }) => {
    try {
      await ack();

      if (body.type !== "block_actions") return;

      const userId = body.user.id;
      const action = body.actions[0];
      const matchId = action.type === "button" ? action.value : "";

      if (!matchId) {
        await client.chat.postMessage({
          channel: userId,
          text: "Invalid match ID.",
        });
        return;
      }

      // Get the match details
      const matchDetails = await doublesMatchService.getDoublesMatchWithPlayers(
        matchId
      );

      if (!matchDetails || matchDetails.status !== "PENDING_CONFIRMATION") {
        await client.chat.postMessage({
          channel: userId,
          text: "This match is no longer available.",
        });
        return;
      }

      // Cancel the match
      await doublesMatchService.cancelDoublesMatch(matchId, userId);

      const allPlayers = [
        matchDetails.team1Player1,
        matchDetails.team1Player2,
        matchDetails.team2Player1,
        matchDetails.team2Player2,
      ];

      // Send cancellation notifications to all players
      const cancelPromises = allPlayers.map((player) =>
        sendDM(player.slackId, {
          text: `The 2v2 match has been cancelled. <@${userId}> declined.`,
        })
      );

      await Promise.all(cancelPromises);

      // Update the original message to show declination
      await client.chat.update({
        channel: body.channel?.id!,
        ts: body.message?.ts!,
        text: "Challenge declined.",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "❌ You have declined this 2v2 challenge.",
            },
          },
        ],
      });
    } catch (error) {
      logger.error(
        `Error declining 2v2 challenge: ${(error as Error).message}`
      );
      await client.chat.postMessage({
        channel: body.user.id,
        text: "An error occurred while declining the challenge. Please try again.",
      });
    }
  });
