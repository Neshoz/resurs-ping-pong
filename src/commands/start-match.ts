import { Command } from "./types";

export const startMatch: Command = async ({ ack, command, client, say }) => {
  await ack();
  console.log(command.text);
  const { members } = await client.users.list({});
  const mentionedUser = members?.find(
    (u) => u.name === command.text.substring(1)
  );
  console.log(mentionedUser);

  await say("Command accepted");
};
