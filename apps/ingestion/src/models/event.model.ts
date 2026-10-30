import {
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";

export const events = pgTable("events", {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
    type: text("type").notNull(),
    context: jsonb("context").notNull().default({}),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});
