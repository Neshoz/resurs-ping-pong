import { app } from "./app";
import { createUser } from "./services/user-service";
import { mainBotChannel } from "./util/core";

/*
createUser({
  name: "kevin.nemec",
  normalizedName: "Kevin Nemec",
  slackId: "U088QAS0F16",
});
*/

(async () => {
  await app.start();
  app.logger.info("Bot is running");
  const { channels } = await app.client.users.conversations({});
  const maybePingPongChannel = channels?.find((c) => c.name === "ping-pong");

  if (!maybePingPongChannel) {
    app.logger.info("Searching for ping-pong channel...");

    const pingPongChannel = await app.client.conversations
      .list()
      .then(({ channels }) =>
        channels?.find((channel) => channel.name === "ping-pong")
      );

    if (!pingPongChannel || !pingPongChannel.id) {
      app.logger.error(
        "No ping-pong channel found in Slack workspace. Exiting app."
      );
      process.exit(1);
    } else {
      app.logger.info("Found ping-pong channel, joining channel.");
      const channel = await app.client.conversations.join({
        channel: pingPongChannel.id,
      });
      mainBotChannel.set(channel.channel!);
      app.logger.info("Joined ping-pong channel.");
    }
  } else {
    mainBotChannel.set(maybePingPongChannel);
  }
})();
