import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspaces } from "./workspace.model";
import { PatternType } from "../features/episodes/enums/patternType";

export const feedbackTemplates = pgTable("feedback_templates", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
    patternType: text("pattern_type").$type<PatternType>().notNull(),
    question: text("question").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
