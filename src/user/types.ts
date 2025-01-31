import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersEloDiffTable, usersTable } from "../db/schema";

const userSelectSchema = createSelectSchema(usersTable);
const userEloDiffSchema = createSelectSchema(usersEloDiffTable);

export type User = z.infer<typeof userSelectSchema>;
export type UserEloDiff = z.infer<typeof userEloDiffSchema>;

const insertUserSchema = createInsertSchema(usersTable);

export type InsertUserBody = z.infer<typeof insertUserSchema>;
