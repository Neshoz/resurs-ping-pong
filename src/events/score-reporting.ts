import { App } from "@slack/bolt";
import * as userService from "../user/user-service";
import * as doublesMatchService from "../match/doubles-match-service";
import { getNextPlayerElo } from "../util/elo";

const SCORE_REGEX = /team\s+([12])\s+won/i;

export const scoreReportingEvent = (app: App) =>
  app.message(async ({ message, client, logger }) => {
    try {
      // Only handle DM messages
      if (message.subtype || message.channel_type !== "im") return;

      const messageText = (message as any).text?.toLowerCase() || "";

      // Check if message contains score reporting format
      if (!SCORE_REGEX.test(messageText)) return;

      const userId = (message as any).user;
      const user = await userService.findUserBySlackId(userId);

      // Find if user is an initiator of an in-progress match
      const match =
        await doublesMatchService.findInProgressDoublesMatchByInitiator(
          user.id
        );

      if (!match) {
        await client.chat.postMessage({
          channel: userId,
          text: "You don't have any active matches to report, or you're not the initiator of the match.",
        });
        return;
      }

      // Parse the winning team
      const scoreMatch = messageText.match(SCORE_REGEX);
      if (!scoreMatch) {
        await client.chat.postMessage({
          channel: userId,
          text: "I couldn't understand that format. Please report the score as: 'Team 1 won 21-15' or 'Team 2 won 21-18'",
        });
        return;
      }

      const winningTeam = parseInt(scoreMatch[1]);

      if (winningTeam !== 1 && winningTeam !== 2) {
        await client.chat.postMessage({
          channel: userId,
          text: "Please specify either 'Team 1' or 'Team 2' as the winner.",
        });
        return;
      }

      // Get match details with all player information
      const matchDetails = await doublesMatchService.getDoublesMatchWithPlayers(
        match.id
      );

      const team1Players = [
        matchDetails.team1Player1,
        matchDetails.team1Player2,
      ];
      const team2Players = [
        matchDetails.team2Player1,
        matchDetails.team2Player2,
      ];

      // Calculate team average ELOs
      const team1AvgElo =
        (parseFloat(team1Players[0].elo) + parseFloat(team1Players[1].elo)) / 2;
      const team2AvgElo =
        (parseFloat(team2Players[0].elo) + parseFloat(team2Players[1].elo)) / 2;

      // Calculate ELO changes for each player
      const team1Won = winningTeam === 1;

      const team1Player1Diff = getNextPlayerElo(
        parseFloat(team1Players[0].elo),
        team2AvgElo,
        team1Won ? 1 : 0
      );

      const team1Player2Diff = getNextPlayerElo(
        parseFloat(team1Players[1].elo),
        team2AvgElo,
        team1Won ? 1 : 0
      );

      const team2Player1Diff = getNextPlayerElo(
        parseFloat(team2Players[0].elo),
        team1AvgElo,
        team1Won ? 0 : 1
      );

      const team2Player2Diff = getNextPlayerElo(
        parseFloat(team2Players[1].elo),
        team1AvgElo,
        team1Won ? 0 : 1
      );

      // Complete the match
      await doublesMatchService.completeDoublesMatch({
        matchId: match.id,
        winningTeam,
        score: messageText,
        team1Player1Diff: { id: team1Players[0].id, diff: team1Player1Diff },
        team1Player2Diff: { id: team1Players[1].id, diff: team1Player2Diff },
        team2Player1Diff: { id: team2Players[0].id, diff: team2Player1Diff },
        team2Player2Diff: { id: team2Players[1].id, diff: team2Player2Diff },
      });

      // Send confirmation to initiator
      await client.chat.postMessage({
        channel: userId,
        text: `Match result recorded! Team ${winningTeam} won. ELO ratings have been updated for all players.`,
      });

      // Send notifications to all players about match completion
      const allPlayers = [...team1Players, ...team2Players];
      const completionPromises = allPlayers
        .filter((player) => player.slackId !== userId) // Don't send to initiator again
        .map((player) => {
          const playerDiff =
            player.id === team1Players[0].id
              ? team1Player1Diff
              : player.id === team1Players[1].id
              ? team1Player2Diff
              : player.id === team2Players[0].id
              ? team2Player1Diff
              : team2Player2Diff;

          return client.chat.postMessage({
            channel: player.slackId,
            text: `Your 2v2 match has been completed! Team ${winningTeam} won.\nYour ELO: ${parseFloat(
              player.elo
            )} → ${playerDiff.newRating} (${playerDiff.delta >= 0 ? "+" : ""}${
              playerDiff.delta
            })`,
          });
        });

      await Promise.all(completionPromises);
    } catch (error) {
      logger.error(
        `Error processing score report: ${(error as Error).message}`
      );
    }
  });
