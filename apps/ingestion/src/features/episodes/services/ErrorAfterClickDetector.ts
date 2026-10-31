import { and, eq, lte } from "drizzle-orm";
import { db } from "../../../db";
import { EventType } from "../../ingestion/enums/eventType";
import type { Event } from "../../ingestion/types/eventType";
import { events as eventsTable } from "../../../models/event.model";
import { CLICK_ERROR_WINDOW_MS } from "../constants/errorAfterClickConstants";

export default class errorAfterClickDetector {
    public static async detect(events: Event[]): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const workspaceId = events[0].workspaceId;
        const errorEvents = events.filter((event) => event.type === EventType.error);

        for (const errorEvent of errorEvents) {
            const clickEvents = await db
                .select()
                .from(eventsTable)
                .where(and(
                    eq(eventsTable.visitorId, errorEvent.visitorId),
                    eq(eventsTable.workspaceId, workspaceId),
                    eq(eventsTable.type, EventType.click),
                    lte(
                        eventsTable.createdAt,
                        new Date(errorEvent.createdAt.getTime() - CLICK_ERROR_WINDOW_MS),
                    ),
                ));

        }
    }
}
