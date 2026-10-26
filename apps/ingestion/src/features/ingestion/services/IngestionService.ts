import { db } from "../../../db"
import type { Event } from "../types/eventType"
import { events as eventsTable } from "../../../models/event.model";
import { workspaces } from "../../../models/workSpace.model";
export default class IngestionService {

	// ------------------------------------------------------------
	// MARK: Upload Events 
	// ------------------------------------------------------------
	public static async upload(events:Event[]):Promise<{
        message: string,
        events: Event[]
    }> {
        const workspaceIds = [...new Set(events.map((event) => event.workspaceId))];

        await db
            .insert(workspaces)
            .values(workspaceIds.map((id) => ({ id, name: "Workspace" })))
            .onConflictDoNothing();

        const values = events.map((event) => ({
            id: event.id,
            visitorId: event.visitorId,
            workspaceId: event.workspaceId,
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
