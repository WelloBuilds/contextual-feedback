import {
    jsonb,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";
import { EpisodeStatus } from "../features/episodes/enums/episodeStatus";
import type { PatternType } from "../features/episodes/enums/patternType";
import type { EventContext } from "../features/ingestion/types/eventType";

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
        errorMessage: text("error_message"),
        context: jsonb("context").$type<EventContext | null>(),
        startedAt: timestamp("started_at", { withTimezone: true }),
        lastOccurredAt: timestamp("last_occurred_at", { withTimezone: true }),
        detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
        closedAt: timestamp("closed_at", { withTimezone: true }),
        metrics: jsonb("metrics"),
        eventIds: jsonb("event_ids").$type<string[]>().notNull().default([]),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
);
