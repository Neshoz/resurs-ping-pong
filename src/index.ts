import { app } from "./app";
import { createUser } from "./user/user-service";
import { mainBotChannel } from "./util/core";

/*
createUser({
  name: "kevin.nemec",
  normalizedName: "Kevin Nemec",
  slackId: "U07NLT3FD7V",
});
*/

(async () => {
  await app.start();
  app.logger.info("Bot is running");

  const { channel } = await app.client.conversations.info({
    channel: "C088U7R0NPN",
  });

  if (!channel) {
    app.logger.error(
      "No ping-pong channel found in Slack workspace. Exiting app."
    );
    process.exit(1);
  } else {
    app.logger.info("Found ping-pong channel, joining channel.");
    await app.client.conversations.join({
      channel: channel!.id!,
    });
    app.logger.info("Joined ping-pong channel.");
    mainBotChannel.set(channel);
  }
})();
