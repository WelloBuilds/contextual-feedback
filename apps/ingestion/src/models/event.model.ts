import {
    pgTable,
    uuid,
    text,
    jsonb,
    timestamp,
  } from "drizzle-orm/pg-core";
import { workspaces } from "./workSpace.model";
  
  export const events = pgTable("events", {
    id: uuid("id").primaryKey(),
    visitorId: uuid("visitor_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull(),
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  
    receivedAt: timestamp("received_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  });