import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";

export const workspaceOrigins = pgTable("workspace_origins", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id),
    origin: text("origin").notNull().unique(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", {
        withTimezone: true,
    }),
});