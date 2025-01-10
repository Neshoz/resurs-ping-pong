import { InvalidCommandError } from "../util/error";
import { USER_MENTION_REGEX } from "../util/mention";
import { Command } from "./types";

export const oneVsOne: Command = async ({
  ack,
  command,
  client,
  say,
  logger,
}) => {
  try {
    await ack();

    if (!USER_MENTION_REGEX.test(command.text)) {
      throw new InvalidCommandError(
        `Invalid command format, correct format is /1v1 @John Doe`
      );
    }

    const userName = command.text.substring(1);
    const { members } = await client.users.list({});
    const mentionedUser = members?.find((u) => u.name === userName);
    logger.info(mentionedUser);

    await say("Command accepted");
  } catch (error) {
    if (error instanceof InvalidCommandError) {
      await say(error.message);
    } else {
      logger.error((error as Error).message);
      await say("An unexpected error has occurred, please try again later.");
    }
  }
};
