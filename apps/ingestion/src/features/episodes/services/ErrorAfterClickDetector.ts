import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../../db";
import { EventType } from "../../ingestion/enums/eventType";
import type { Event, EventContext } from "../../ingestion/types/eventType";
import { events as eventsTable } from "../../../models/event.model";
import { CLICK_ERROR_WINDOW_MS } from "../constants/errorAfterClickConstants";
import { PatternType } from "../enums/patternType";
import { EpisodeStatus } from "../enums/episodeStatus";
import { episodes } from "../../../models/episode.model";
import EventContextValidator from "../../ingestion/validators/eventContextValidator";

export default class errorAfterClickDetector {

	// ------------------------------------------------------------
	// MARK: Detect
	// ------------------------------------------------------------

    public static async detect(events: Event[]): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const workspaceId = events[0].workspaceId;
        const errorEvents = events.filter(
            (event): event is Extract<Event, { type: EventType.error }> => event.type === EventType.error,
        );

        for (const errorEvent of errorEvents) {
            const errorContext = EventContextValidator.context().safeParse(errorEvent.context);
            if (!errorContext.success) continue;

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

            const allClicksOnSamePage = clickEvents.every((clickEvent) => {
                const clickContext = EventContextValidator.context().safeParse(clickEvent.context);
                return clickContext.success && clickContext.data.page.path === errorContext.data.page.path;
            });

            if (!allClicksOnSamePage) continue;

            await this.createErrorAfterClickEpisode(
                workspaceId,
                errorEvent,
                clickEvents.map((event) => event.id),
                errorContext.data,
            );
        }
    }


	// ------------------------------------------------------------
	// MARK: Create Episode
	// ------------------------------------------------------------

    public static async createErrorAfterClickEpisode(
        workspaceId: string,
        errorEvent: Extract<Event, { type: EventType.error }>,
        clickEventIds: string[],
        context: EventContext,
    ) {
        const eventIds = [errorEvent.id, ...clickEventIds];

        const episode = {
            "id": crypto.randomUUID(),
            "workspaceId": workspaceId,
            "visitorId": errorEvent.visitorId,
            "sessionId": errorEvent.sessionId,
            "patternType": PatternType.errorAfterClick, 
            "errorMessage": errorEvent.payload.message,
            context,
            "status": EpisodeStatus.active,
            "detectedAt": errorEvent.createdAt,
            "eventIds": eventIds,
            "createdAt": new Date(),
            "deletedAt": null,
        }
        await db.insert(episodes).values(episode);
    }
}
