import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";
import { visitor } from "./visitor.model";
import { episodes } from "./episode.model";
import { findings } from "./finding.model";
import { feedback_templates } from "./feedback_templates.model";

export const feedback = pgTable("feedback", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
    visitorId: uuid("visitor_id").references(() => visitor.id).notNull(),
    episodeId: uuid("episode_id").references(() => episodes.id).notNull(),
    findingId: uuid("finding_id").references(() => findings.id).notNull(),
    templateId: uuid("template_id").references(() => feedback_templates.id).notNull(),
    status: text("status").notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});