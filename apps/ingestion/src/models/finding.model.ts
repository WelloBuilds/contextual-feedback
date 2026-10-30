import {
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";

export const findings = pgTable(
    "findings",
    {
        id: uuid("id").primaryKey(),
        workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
        visitorId: uuid("visitor_id"),
        sessionId: uuid("session_id"),
        patternType: text("pattern_type").notNull(),
        targetKey: text("target_key"),
        evidence: jsonb("evidence").notNull().default({}),
        metrics: jsonb("metrics").notNull().default({}),
        confidence: numeric("confidence", { precision: 3, scale: 2 }),
        status: text("status").notNull().default("candidate"),
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
