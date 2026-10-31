import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "../../../db";
import { EventType } from "../../ingestion/enums/eventType";
import type { Event } from "../../ingestion/types/eventType";
import { events as eventsTable } from "../../../models/event.model";
import { CLICK_ERROR_WINDOW_MS } from "../constants/errorAfterClickConstants";
import { PatternType } from "../enums/patternType";
import { EpisodeStatus } from "../enums/episodeStatus";
import { episodes } from "../../../models/episode.model";

export default class errorAfterClickDetector {
    public static async detect(events: Event[]): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const workspaceId = events[0].workspaceId;
        const errorEvents = events.filter((event) => event.type === EventType.error);

        for (const errorEvent of errorEvents) {
            const existingError = await db
                .select()
                .from(episodes)
                .where(and(
                    eq(episodes.visitorId, errorEvent.visitorId),
                    eq(episodes.workspaceId, workspaceId),
                    sql`${episodes.eventIds} ? ${errorEvent.id}`
                ))

            if(existingError.length > 0)
                return

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
            this.createErrorAfterClickEpisode(
                workspaceId,
                errorEvent,
                clickEvents.map((event) => event.id),
            );
        }
    }

    public static async createErrorAfterClickEpisode(
        workspaceId: string,
        errorEvent: Event,
        clickEventIds: string[],
    ) {
        const eventIds = [errorEvent.id, ...clickEventIds];

        const episode = {
            "id": crypto.randomUUID(),
            "workspaceId": workspaceId,
            "visitorId": errorEvent.visitorId,
            "sessionId": errorEvent.sessionId,
            "patternType": PatternType.errorAfterClick, 
            "status": EpisodeStatus.active,
            "detectedAt": errorEvent.createdAt,
            "eventIds": eventIds,
            "createdAt": new Date(),
            "deletedAt": null,
        }
        await db.insert(episodes).values(episode);
    }
}
