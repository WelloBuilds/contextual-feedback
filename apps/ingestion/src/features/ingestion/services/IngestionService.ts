import { db } from "../../../db"
import type { Event } from "../types/eventType"
import { events as eventsTable } from "../../../models/event.model";
import { workspaces } from "../../../models/workspace.model";
import { workspaceOrigins } from "../../../models/workspaceOrigin.model";
import RageClicksDetector from "../../insights/services/RageClicksDetector";
import { eq } from "drizzle-orm";
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

        void RageClicksDetector.detect(insertedEvents as Event[]).catch((error) => {
            console.error("Rage click detection failed", error);
        });

        return {
            message: "Events received",
            events: insertedEvents as Event[],
        };
	}

	// ------------------------------------------------------------
	// MARK: Fetch Workspace
	// ------------------------------------------------------------

    public static async validateWorkspace(workspaceId: string): Promise<boolean> {
        const existing = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.id, workspaceId))
            .limit(1);

        return existing.length > 0;
    }

	// ------------------------------------------------------------
	// MARK: Fetch Workspace Origin
	// ------------------------------------------------------------

    public static async validateWorkspaceOrigin(workspaceId: string): Promise<string | null> {
        const workspaceOrigin = await db.select().from(workspaceOrigins).where(eq(workspaceOrigins.workspaceId, workspaceId)).limit(1);
        if (workspaceOrigin.length === 0) {
            return null;
        }
        return workspaceOrigin[0].origin;
    }

}
