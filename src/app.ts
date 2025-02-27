import { App } from "@slack/bolt";
import { oneVsOneCommand } from "./commands/oneVsOne";
import { winnerCommand } from "./commands/winner";
import { memberJoinedChannelEvent } from "./events/member-joined-channel";
import { acceptChallengeAction } from "./actions/accept-challenge";

export const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  port: 3000,
});

oneVsOneCommand(app);

winnerCommand(app);

acceptChallengeAction(app);

memberJoinedChannelEvent(app);
