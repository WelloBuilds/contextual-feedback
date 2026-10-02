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
        const insertedEvents = await db
            .insert(eventsTable)
            .values(events)
            .returning();

        return {
            message: "Events received",
            events: insertedEvents as Event[],
        };
	}
}
