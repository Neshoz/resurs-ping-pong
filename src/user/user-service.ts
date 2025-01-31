import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../db/schema";
import { InsertUserBody } from "./types";

export const findUsersById = async (...ids: string[]) => {
  return db.select().from(usersTable).where(inArray(usersTable.id, ids));
};

export const findUserBySlackName = async (slackName: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.slackName, slackName));

  if (!user) {
    throw new Error(`User with slack name ${slackName} not found.`);
  }

  return user;
};

export const findUserBySlackId = async (slackId: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.slackId, slackId));

  if (!user) {
    throw new Error(`User with slack id ${slackId} not found.`);
  }

  return user;
};

export const createUser = async (user: InsertUserBody) => {
  const [newUser] = await db
    .insert(usersTable)
    .values({
      elo: user.elo,
      slackName: user.slackName,
      slackId: user.slackId,
      fullName: user.fullName,
      email: user.email,
    })
    .returning();

  return newUser;
};
