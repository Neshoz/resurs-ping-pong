import { app } from "./app";
import { createUser } from "./user/user-service";

/*
createUser({
  elo: "1200",
  email: "filip.vester@resurs.se",
  fullName: "Filip Vester",
  slackId: "U08818TMSJW",
  slackName: "filip.vester",
});
*/

(async () => {
  await app.start();
  app.logger.info("Bot is running");

  const { channel } = await app.client.conversations.info({
    channel: process.env.SLACK_MAIN_CHANNEL_ID!,
  });

  if (!channel) {
    app.logger.error(
      "No ping-pong channel found in Slack workspace. Exiting app."
    );
    process.exit(1);
  } else {
    app.logger.info("Found ping-pong channel, joining channel.");
    await app.client.conversations.join({
      channel: channel.id!,
    });
    app.logger.info("Joined ping-pong channel.");
  }
})();
