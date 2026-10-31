import {
    integer,
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { FindingStatus } from "../features/insights/enums/findingStatus";
import { workspaces } from "./workspace.model";
import type { PatternType } from "../features/insights/enums/patternType";
import type { PatternMetrics } from "../features/insights/types/findingType";

export const findings = pgTable(
    "findings",
    {
        id: uuid("id").primaryKey(),
        workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
        patternType: text("pattern_type").$type<PatternType>().notNull(),
        targetKey: text("target_key"),
        evidence: jsonb("evidence").notNull().default({}),
        affectedVisitorCount: integer("affected_visitor_count").notNull(),
        affectedSessionCount: integer("affected_session_count").notNull(),
        episodeCount: integer("episode_count").notNull(),
        metrics: jsonb("metrics").$type<PatternMetrics[PatternType]>().notNull(),
        confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull(),
        status: text("status").$type<FindingStatus>().notNull().default(FindingStatus.candidate),
        firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
        lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("findings_workspace_pattern_target_unique").on(
            table.workspaceId,
            table.patternType,
            table.targetKey,
        ),
    ],
);
