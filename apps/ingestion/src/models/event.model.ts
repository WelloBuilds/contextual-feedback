import {
    pgTable,
    uuid,
    text,
    jsonb,
    timestamp,
  } from "drizzle-orm/pg-core";
  
  export const events = pgTable("events", {
    id: uuid("id").primaryKey(),
    sessionId: uuid("session_id").notNull(),
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