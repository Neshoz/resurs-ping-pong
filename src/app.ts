import { App } from "@slack/bolt";
import { startMatch } from "./commands/start-match";

export const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  port: 3000,
});

app.command("/start-match", startMatch);
