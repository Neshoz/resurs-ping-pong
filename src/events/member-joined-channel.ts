import { App } from "@slack/bolt";
import * as userService from "../user/user-service";

export const memberJoinedChannelEvent = (app: App) =>
  app.event("member_joined_channel", async ({ event, client }) => {
    if (event.channel === process.env.SLACK_MAIN_CHANNEL_ID) {
      const { user } = await client.users.info({ user: event.user });
      await userService.createUser({
        elo: "1200",
        email: user!.profile!.email!,
        fullName: user!.real_name!,
        slackId: user!.id!,
        slackName: user!.name!,
      });
    }
  });
