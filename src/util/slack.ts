import { SayArguments, webApi } from "@slack/bolt";
import { EloDiff } from "./elo";
import { User } from "../user/types";
import { app } from "../app";
import { ChallengeRequest } from "../match/types";

/*
type SlackPostMessageFnArgs = webApi.WebClient['chat']['postMessage'];
type MessageArgs = Parameters<SlackPostMessageFnArgs>[0];
*/

type UserWithDiff = {
  fullName: string;
  diff: EloDiff;
};

export const createMatchResultAttachment = (
  winner: UserWithDiff,
  loser: UserWithDiff
): SayArguments => {
  return {
    attachments: [
      {
        title: "Match completed!",
        text: "Match completed!",
        fields: [
          {
            title: "Winner",
            value: `${winner.fullName}, Elo: ${winner.diff.newRating} (+${winner.diff.delta})`,
          },
          {
            title: "Loser",
            value: `${loser.fullName}, Elo: ${loser.diff.newRating} (${loser.diff.delta})`,
          },
        ],
      },
    ],
  };
};

export const askToChallenge = (
  opponent: User,
  challenger: User
): webApi.Block[] | webApi.KnownBlock[] => {
  const createChallengeRequest = (accepted: boolean): ChallengeRequest => ({
    opponent: { id: opponent.id, slackId: opponent.slackId },
    challenger: { id: challenger.id, slackId: challenger.slackId },
    accepted,
  });

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<@${challenger.slackId}> is challenging you. Do you want to accept?`,
      },
    },
    {
      type: "actions",
      block_id: "accept_challenge",
      elements: [
        {
          type: "button",
          action_id: "accept_challenge_action",
          text: {
            type: "plain_text",
            text: "Yes",
          },
          style: "primary",
          value: JSON.stringify(createChallengeRequest(true)),
        },
        {
          type: "button",
          action_id: "deny_challenge_action",
          text: {
            type: "plain_text",
            text: "No",
          },
          value: JSON.stringify(createChallengeRequest(false)),
        },
      ],
    },
  ];
};

export const sendDM = async (userSlackId: string, args: any) => {
  const dmReciever = await app.client.conversations.open({
    users: userSlackId,
  });

  return app.client.chat.postMessage({
    ...args,
    channel: dmReciever.channel!.id!,
  });
};

export const deleteDM = async (channelId: string, timestamp: string) => {
  return app.client.chat.delete({ channel: channelId, ts: timestamp });
};
