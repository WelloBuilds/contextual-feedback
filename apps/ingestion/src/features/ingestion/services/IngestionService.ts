import type { Event } from "../types/eventType"

export default class IngestionService {

	// ------------------------------------------------------------
	// MARK: Upload Events 
	// ------------------------------------------------------------
	public static async upload(events:Event[]):Promise<{
        message: string,
        events: Event[]
    }> {
        return ({
            message: "events Received",
            events: events
        });
	}
}
