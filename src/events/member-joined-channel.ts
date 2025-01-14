import { mainBotChannel } from "../util/core";
import * as userService from "../user/user-service";
import { App } from "@slack/bolt";

export const memberJoinedChannelEvent = (app: App) =>
  app.event("member_joined_channel", async ({ event, client }) => {
    const pingPongChannel = mainBotChannel.get();
    if (event.channel === pingPongChannel!.id) {
      const { user } = await client.users.info({ user: event.user });
      await userService.createUser({
        name: user!.name!,
        normalizedName: user!.real_name!,
        slackId: user!.id!,
      });
    }
  });
