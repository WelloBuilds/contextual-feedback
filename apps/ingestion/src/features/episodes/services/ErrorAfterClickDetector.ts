import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../../db";
import { EventType } from "../../ingestion/enums/eventType";
import type { Event } from "../../ingestion/types/eventType";
import { events as eventsTable } from "../../../models/event.model";
import { CLICK_ERROR_WINDOW_MS } from "../constants/errorAfterClickConstants";
import { PatternType } from "../enums/patternType";
import { EpisodeStatus } from "../enums/episodeStatus";
import { episodes } from "../../../models/episode.model";

export default class errorAfterClickDetector {

	// ------------------------------------------------------------
	// MARK: Detect
	// ------------------------------------------------------------

    public static async detect(events: Event[]): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const workspaceId = events[0].workspaceId;
        const errorEvents = events.filter((event) => event.type === EventType.error);

        for (const errorEvent of errorEvents) {
            const existingEpisode = await db
                .select()
                .from(episodes)
                .where(and(
                    eq(episodes.visitorId, errorEvent.visitorId),
                    eq(episodes.workspaceId, workspaceId),
                    eq(episodes.patternType, PatternType.errorAfterClick),
                    sql`${episodes.eventIds} ? ${errorEvent.id}`
                ))

            if(existingEpisode.length > 0)
                continue

            const clickEvents = await db
                .select()
                .from(eventsTable)
                .where(and(
                    eq(eventsTable.visitorId, errorEvent.visitorId),
                    eq(eventsTable.workspaceId, workspaceId),
                    eq(eventsTable.type, EventType.click),
                    and(
                        gte(
                            eventsTable.createdAt,
                            new Date(errorEvent.createdAt.getTime() - CLICK_ERROR_WINDOW_MS),
                        ),
                        lte(
                            eventsTable.createdAt,
                            new Date(errorEvent.createdAt.getTime()),
                        )

                    ),
                ));

            if(clickEvents.length == 0)
                continue

            await this.createErrorAfterClickEpisode(
                workspaceId,
                errorEvent,
                clickEvents.map((event) => event.id),
            );
        }
    }


	// ------------------------------------------------------------
	// MARK: Create Episode
	// ------------------------------------------------------------

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
