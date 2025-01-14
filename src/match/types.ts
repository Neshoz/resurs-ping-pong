import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { singlesMatchesTable } from "../db/schema";

const matchSelectSchema = createSelectSchema(singlesMatchesTable);
export type Match = z.infer<typeof matchSelectSchema>;

export type GameResultUser = {
  id: string;
  fullName: string;
  name: string;
  elo: number;
};
