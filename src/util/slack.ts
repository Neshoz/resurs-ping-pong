import { SayArguments } from "@slack/bolt";
import { EloDiff } from "./elo";

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
