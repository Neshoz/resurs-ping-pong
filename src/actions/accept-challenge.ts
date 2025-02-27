import { App } from "@slack/bolt";
import { ChallengeRequest } from "../match/types";
import { emitter } from "../util/events";
import { sendDM } from "../util/slack";
import { createMatch } from "../match/match-service";

export const acceptChallengeAction = (app: App) => {
  app.action({ block_id: "accept_challenge" }, async ({ ack, action }) => {
    await ack();
    if (action.type !== "button" || !action.value) return;

    const { opponent, challenger, accepted }: ChallengeRequest = JSON.parse(
      action.value
    );

    emitter.emit("dmSent");

    if (!accepted) {
      await sendDM(challenger.slackId, {
        text: `<@${opponent.slackId}> declined your challenge.`,
      });
      return;
    }

    await sendDM(challenger.slackId, {
      text: `<@${opponent.slackId}> accepted your challenge.`,
    });
    await createMatch(opponent.id, challenger.id);
  });
};
