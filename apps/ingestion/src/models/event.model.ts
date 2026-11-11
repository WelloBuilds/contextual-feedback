import {
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";
import { visitor } from "./visitor.model";
import { sessions } from "./session.model";

export const events = pgTable("events", {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id").references(() => visitor.id).notNull(),
    sessionId: uuid("session_id").references(() => sessions.id).notNull(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
    type: text("type").notNull(),
    context: jsonb("context").notNull().default({}),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});
