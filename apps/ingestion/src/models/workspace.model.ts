import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", {
        withTimezone: true,
    }),
});