import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { singlesMatchesTable, doublesMatchesTable } from "../db/schema";

const matchSelectSchema = createSelectSchema(singlesMatchesTable);
export type Match = z.infer<typeof matchSelectSchema>;

const doublesMatchSelectSchema = createSelectSchema(doublesMatchesTable);
export type DoublesMatch = z.infer<typeof doublesMatchSelectSchema>;

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

export type DoublesMatchStatus =
  | "PENDING_CONFIRMATION"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
