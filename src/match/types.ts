import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { singlesMatchesTable } from "../db/schema";

const matchSelectSchema = createSelectSchema(singlesMatchesTable);
export type Match = z.infer<typeof matchSelectSchema>;

export type GameResultUser = {
  id: string;
  fullName: string;
  slackName: string;
  elo: number;
};

export type ChallengeRequest = {
  opponent: { id: string; slackId: string };
  challenger: { id: string; slackId: string };
  accepted: boolean;
};
