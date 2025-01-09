import {
  Middleware,
  SlackCommandMiddlewareArgs,
  StringIndexed,
} from "@slack/bolt";

export type Command = Middleware<SlackCommandMiddlewareArgs, StringIndexed[]>;
