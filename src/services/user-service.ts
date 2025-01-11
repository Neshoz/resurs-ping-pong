import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../db/schema";

export const findUsersById = async (...ids: string[]) => {
  return db.select().from(usersTable).where(inArray(usersTable.id, ids));
};

export const findUserBySlackName = async (name: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.name, name));

  if (!user) {
    throw new Error(`User with name ${name} not found.`);
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

interface CreateUserArgs {
  slackId: string;
  name: string;
  normalizedName: string;
}

export const createUser = async (user: CreateUserArgs) => {
  const [newUser] = await db
    .insert(usersTable)
    .values({
      elo: "1200",
      name: user.name,
      normalizedName: user.normalizedName,
      slackId: user.slackId,
    })
    .returning();

  return newUser;
};
