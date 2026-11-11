import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { visitor } from "./visitor.model";
import { workspaces } from "./workspace.model";

export const sessions = pgTable("sessions", {
	id: uuid("id").primaryKey(),
	workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
	visitorId: uuid("visitor_id").references(() => visitor.id).notNull(),
	lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
