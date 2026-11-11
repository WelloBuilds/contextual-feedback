import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { events as eventsTable } from "../../../models/event.model";
import { workspaces } from "../../../models/workspace.model";
import { workspaceOrigins } from "../../../models/workspaceOrigin.model";
import RageClicksDetector from "../../episodes/services/RageClicksDetector";
import errorAfterClickDetector from "../../episodes/services/ErrorAfterClickDetector";
import type { Event } from "../types/eventType";
import VisitorsService from "../../visitors/services/VisitorsService";
import SessionsService from "../../sessions/services/SessionsService";
import EventsService from "../../events/services/EventsService";
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
			context: event.context,
			payload: event.payload,
			createdAt: event.createdAt,
		}));

		await db.transaction(async (tx) => {
			await VisitorsService.create(values[0].workspaceId, values[0].visitorId);
			await SessionsService.create(values[0].sessionId, values[0].workspaceId, values[0].visitorId, values[0].createdAt);
			await EventsService.create(events)
		});

        void RageClicksDetector.detect(events as Event[]).catch((error) => {
            console.error("Rage click detection failed", error);
        });

        void errorAfterClickDetector.detect(events as Event[]).catch((error) => {
            console.error("Error after click detection failed", error);
        });

        return {
            message: "Events received",
            events: events as Event[],
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
