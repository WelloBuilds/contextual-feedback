import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { feedback } from "./feedback.model";
import { visitor } from "./visitor.model";

const feedback_response = pgTable("feedback_response", {
    id: uuid("id").primaryKey().defaultRandom(),
    feedbackId: uuid("feedback_id").references(() => feedback.id).notNull(),
    visitorId: uuid("visitor_id").references(() => visitor.id).notNull(),
    selectedOption: text("selected_option"),
    textResponse: text("text_response"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});