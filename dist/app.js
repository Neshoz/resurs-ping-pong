"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const bolt_1 = require("@slack/bolt");
const start_match_1 = require("./commands/start-match");
exports.app = new bolt_1.App({
    appToken: process.env.SLACK_APP_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    port: 3000,
});
exports.app.command("/start-match", start_match_1.startMatch);
