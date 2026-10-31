import {
    jsonb,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";
import type { EpisodeStatus } from "../features/insights/types/episodeType";
import type { PatternType } from "../features/insights/enums/patternType";

export const episodes = pgTable(
    "episodes",
    {
        id: uuid("id").primaryKey(),
        workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
        visitorId: uuid("visitor_id").notNull(),
        sessionId: uuid("session_id").notNull(),
        patternType: text("pattern_type").$type<PatternType>().notNull(),
        targetKey: text("target_key"),
        status: text("status").$type<EpisodeStatus>().notNull().default("active"),
        startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
        lastOccurredAt: timestamp("last_occurred_at", { withTimezone: true }).notNull(),
        detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
        closedAt: timestamp("closed_at", { withTimezone: true }),
        metrics: jsonb("metrics").$type<Record<string, unknown>>().notNull().default({}),
        evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
        eventIds: jsonb("event_ids").$type<string[]>().notNull().default([]),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("episodes_active_lookup_idx").on(
            table.workspaceId,
            table.visitorId,
            table.patternType,
            table.targetKey,
            table.status,
        ),
        index("episodes_aggregation_idx").on(
            table.workspaceId,
            table.patternType,
            table.targetKey,
            table.status,
            table.startedAt,
        ),
    ],
);
