import { App } from "@slack/bolt";
import { oneVsOne } from "./commands/oneVsOne";

export const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  port: 3000,
});

app.command("/1v1", oneVsOne);
