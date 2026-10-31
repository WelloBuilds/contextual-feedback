import {
    check,
    jsonb,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspace.model";
import { EpisodeStatus } from "../features/episodes/enums/episodeStatus";
import type { Episode } from "../features/episodes/types/episodeType";
import { PatternType } from "../features/episodes/enums/patternType";

export const episodes = pgTable(
    "episodes",
    {
        id: uuid("id").primaryKey(),
        workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
        visitorId: uuid("visitor_id").notNull(),
        sessionId: uuid("session_id").notNull(),
        patternType: text("pattern_type").$type<PatternType>().notNull(),
        targetKey: text("target_key"),
        status: text("status").$type<EpisodeStatus>().notNull().default(EpisodeStatus.active),
        startedAt: timestamp("started_at", { withTimezone: true }),
        lastOccurredAt: timestamp("last_occurred_at", { withTimezone: true }),
        detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
        closedAt: timestamp("closed_at", { withTimezone: true }),
        metrics: jsonb("metrics").$type<Episode["metrics"]>().notNull(),
        eventIds: jsonb("event_ids").$type<string[]>().notNull().default([]),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
        check(
            "episodes_rage_click_required_fields_check",
            sql`${table.patternType} <> ${PatternType.rageClicks} OR (
                ${table.targetKey} IS NOT NULL AND
                ${table.startedAt} IS NOT NULL AND
                ${table.lastOccurredAt} IS NOT NULL AND
                ${table.metrics} ->> 'patternType' = ${PatternType.rageClicks} AND
                ${table.metrics} ? 'clickCount'
            )`,
        ),
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
