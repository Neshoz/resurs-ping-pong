import { App } from "@slack/bolt";
import { oneVsOneCommand } from "./commands/oneVsOne";
import { winnerCommand } from "./commands/winner";
import { twoVsTwoCommandHandler } from "./commands/twoVsTwo";
import { cancelCommandHandler } from "./commands/cancel";
import { memberJoinedChannelEvent } from "./events/member-joined-channel";
import { scoreReportingEvent } from "./events/score-reporting";
import { acceptChallengeAction } from "./actions/accept-challenge";
import {
  accept2v2ChallengeAction,
  decline2v2ChallengeAction,
} from "./actions/accept-2v2-challenge";

export const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  port: 3000,
});

// Commands
oneVsOneCommand(app);
winnerCommand(app);
twoVsTwoCommandHandler(app);
cancelCommandHandler(app);

// Actions
acceptChallengeAction(app);
accept2v2ChallengeAction(app);
decline2v2ChallengeAction(app);

// Events
memberJoinedChannelEvent(app);
scoreReportingEvent(app);
