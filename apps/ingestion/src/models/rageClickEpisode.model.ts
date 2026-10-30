import {
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";

export const rageClickEpisodes = pgTable("rage_click_episodes", {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
    visitorId: uuid("visitor_id").notNull(),
    sessionId: uuid("session_id"),
    targetKey: text("target_key").notNull(),
    clickCount: integer("click_count").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
    lastClickAt: timestamp("last_click_at", { withTimezone: true }).notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("active"),
    eventIds: jsonb("event_ids").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
