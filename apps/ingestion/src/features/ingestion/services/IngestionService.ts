import { db } from "../../../db"
import type { Event } from "../types/eventType"
import { events as eventsTable } from "../../../models/event.model";
export default class IngestionService {

	// ------------------------------------------------------------
	// MARK: Upload Events 
	// ------------------------------------------------------------
	public static async upload(events:Event[]):Promise<{
        message: string,
        events: Event[]
    }> {
        const values = events.map((event) => ({
            id: event.id,
            visitorId: event.visitorId,
            sessionId: event.sessionId,
            type: event.type,
            payload: event.payload,
            createdAt: event.createdAt,
            deletedAt: null,
        }));

        const insertedEvents = await db
            .insert(eventsTable)
            .values(values)
            .returning();

        return {
            message: "Events received",
            events: insertedEvents as Event[],
        };
	}
}
