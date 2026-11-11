import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";

export const visitor = pgTable("visitor", {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex("visitor_workspace_token_unique").on(table.workspaceId, table.id),
]);
