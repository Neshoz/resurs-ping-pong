"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMatch = void 0;
const startMatch = async ({ ack, command, client, say }) => {
    await ack();
    console.log(command.text);
    const { members } = await client.users.list({});
    const user = members?.find((u) => u.name === command.text.substring(1));
    console.log(user?.id);
    await say("Command accepted");
};
exports.startMatch = startMatch;
