import { type AnyPgColumn, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";
import { visitor } from "./visitor.model";
import { episodes } from "./episode.model";
import { findings } from "./finding.model";
import { feedbackTemplates } from "./feedbackTemplates.model";

export const feedback = pgTable("feedback", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references((): AnyPgColumn => workspaces.id).notNull(),
    visitorId: uuid("visitor_id").references((): AnyPgColumn => visitor.id).notNull(),
    episodeId: uuid("episode_id").references((): AnyPgColumn => episodes.id).notNull(),
    findingId: uuid("finding_id").references((): AnyPgColumn => findings.id).notNull(),
    templateId: uuid("template_id").references((): AnyPgColumn => feedbackTemplates.id).notNull(),
    status: text("status").notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});