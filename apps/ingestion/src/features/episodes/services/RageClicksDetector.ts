import { and, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { db } from "../../../db";
import { events } from "../../../models/event.model";
import { episodes } from "../../../models/episode.model";
import type { ClickPayload } from "../../ingestion/types/clickPayloadType";
import type { Event } from "../../ingestion/types/eventType";
import {
    EPISODE_INACTIVITY_MS,
    MAX_CLICK_GAP_MS,
    MAX_EPISODE_DURATION_MS,
    MIN_CLICKS,
    RAGE_WINDOW_MS,
} from "../constants/rageClickConstants";
import { PatternType } from "../enums/patternType";
import { EpisodeStatus } from "../enums/episodeStatus";
import FindingsService from "../../findings/services/FindingsService";
import type { Episode } from "../types/episodeType";
import EpisodesValidator from "../validators/episodesValidator";

type ClickRecord = typeof events.$inferSelect;

const GENERATED_CLASS_PATTERN = /\d{4,}|^[a-f0-9]{8,}$/i;
const CSS_IN_JS_CLASS_PATTERN = /^css-|^sc-/i;

function getTargetKey(payload: ClickPayload): string | null {
    if (payload.ignoredForRage || payload.isTrusted === false) {
        return null;
    }

    if (payload.targetId?.trim()) {
        return `customer:${payload.targetId.trim()}`;
    }

    if (payload.role || payload.accessibleName) {
        return [
            "semantic",
            payload.tagName ?? "",
            payload.role ?? "",
            payload.accessibleName ?? "",
            payload.fingerprint ?? "",
        ].join(":");
    }

    if (payload.fingerprint) {
        return `fingerprint:${payload.fingerprint}`;
    }

    const tagName = payload.tagName?.toLowerCase() ?? "";
    const classNames = (payload.className ?? "")
        .split(/\s+/)
        .filter((name) =>
            name &&
            !GENERATED_CLASS_PATTERN.test(name) &&
            !CSS_IN_JS_CLASS_PATTERN.test(name),
        )
        .sort()
        .join(".");

    if (tagName && classNames) {
        return `dom:${tagName}:${classNames}`;
    }

    return `position:${Math.round(payload.x / 30)}:${Math.round(payload.y / 30)}`;
}

function getClickRecord(event: ClickRecord): { event: ClickRecord; targetKey: string } | null {
    if (event.type !== "click") {
        return null;
    }

    const targetKey = getTargetKey(event.payload as ClickPayload);
    return targetKey ? { event, targetKey } : null;
}

function isRageClickBurst(clicks: ClickRecord[]): boolean {
    if (clicks.length < MIN_CLICKS) {
        return false;
    }

    const timestamps = clicks.map((click) => click.createdAt.getTime());
    const duration = timestamps[timestamps.length - 1] - timestamps[0];
    const gaps = timestamps.slice(1).map((timestamp, index) => timestamp - timestamps[index]);

    return duration <= RAGE_WINDOW_MS && gaps.every((gap) => gap <= MAX_CLICK_GAP_MS);
}

async function getConsecutiveClicks(
    event: Event,
    targetKey: string,
): Promise<ClickRecord[]> {
    const occurredAt = new Date(event.createdAt);
    const recentClicks = await db
        .select()
        .from(events)
        .where(and(
            eq(events.workspaceId, event.workspaceId),
            eq(events.visitorId, event.visitorId),
            eq(events.type, "click"),
            gte(events.createdAt, new Date(occurredAt.getTime() - RAGE_WINDOW_MS)),
            lte(events.createdAt, occurredAt),
        ));

    const orderedClicks = recentClicks.sort((left, right) =>
        left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id),
    );
    const currentIndex = orderedClicks.findIndex((click) => click.id === event.id);
    const consecutiveClicks: ClickRecord[] = [];

    for (let index = currentIndex; index >= 0; index -= 1) {
        const click = getClickRecord(orderedClicks[index]);
        if (!click || click.targetKey !== targetKey) {
            break;
        }

        consecutiveClicks.unshift(click.event);
    }

    return consecutiveClicks;
}

async function findActiveEpisode(
    workspaceId: string,
    visitorId: string,
    targetKey: string,
): Promise<Episode | undefined> {
    const [episode] = await db
        .select()
        .from(episodes)
        .where(and(
            eq(episodes.workspaceId, workspaceId),
            eq(episodes.visitorId, visitorId),
            eq(episodes.patternType, PatternType.rageClicks),
            eq(episodes.targetKey, targetKey),
            eq(episodes.status, EpisodeStatus.active),
            isNotNull(episodes.startedAt),
            isNotNull(episodes.lastOccurredAt),
        ))
        .limit(1);

    return episode as Episode | undefined;
}

async function recordEpisode(event: Event, targetKey: string): Promise<void> {
    const clicks = await getConsecutiveClicks(event, targetKey);
    if (!isRageClickBurst(clicks)) {
        return;
    }

    const firstClick = clicks[0];
    const lastClick = clicks[clicks.length - 1];
    const existingEpisode = await findActiveEpisode(event.workspaceId, event.visitorId, targetKey);
    const continuesEpisode = existingEpisode &&
        lastClick.createdAt.getTime() - existingEpisode.lastOccurredAt.getTime() <= EPISODE_INACTIVITY_MS &&
        lastClick.createdAt.getTime() - existingEpisode.startedAt.getTime() <= MAX_EPISODE_DURATION_MS;

    if (existingEpisode && !continuesEpisode) {
        await db
            .update(episodes)
            .set({ status: EpisodeStatus.closed, closedAt: new Date() })
            .where(eq(episodes.id, existingEpisode.id));
        await FindingsService.aggregateRageClicks(event.workspaceId, targetKey);
    }

    const eventIds = [...new Set([
        ...(continuesEpisode ? existingEpisode.eventIds as string[] : []),
        ...clicks.map((click) => click.id),
    ])];

    if (continuesEpisode) {
        await db
            .update(episodes)
            .set({
                metrics: {
                    patternType: PatternType.rageClicks,
                    clickCount: eventIds.length,
                },
                lastOccurredAt: lastClick.createdAt,
                eventIds,
            })
            .where(eq(episodes.id, existingEpisode.id));
        return;
    }

    const episode = EpisodesValidator.create().parse({
        id: crypto.randomUUID(),
        workspaceId: event.workspaceId,
        visitorId: event.visitorId,
        sessionId: lastClick.sessionId,
        patternType: PatternType.rageClicks,
        targetKey,
        status: EpisodeStatus.active,
        startedAt: firstClick.createdAt,
        lastOccurredAt: lastClick.createdAt,
        detectedAt: new Date(event.createdAt),
        closedAt: null,
        metrics: {
            patternType: PatternType.rageClicks,
            clickCount: eventIds.length,
        },
        eventIds,
    });

    await db.insert(episodes).values(episode);
}

async function closeStaleEpisodes(workspaceIds: string[]): Promise<void> {
    if (workspaceIds.length === 0) {
        return;
    }

    const now = new Date();
    const staleBefore = new Date(now.getTime() - EPISODE_INACTIVITY_MS);
    const closedEpisodes = await db
        .update(episodes)
        .set({ status: EpisodeStatus.closed, closedAt: now })
        .where(and(
            inArray(episodes.workspaceId, workspaceIds),
            eq(episodes.patternType, PatternType.rageClicks),
            eq(episodes.status, EpisodeStatus.active),
            lte(episodes.lastOccurredAt, staleBefore),
        ))
        .returning();

    const affectedTargets = new Map<string, Set<string>>();
    for (const { workspaceId, targetKey } of closedEpisodes) {
        if (!targetKey) {
            continue;
        }

        const targetKeys = affectedTargets.get(workspaceId) ?? new Set<string>();
        targetKeys.add(targetKey);
        affectedTargets.set(workspaceId, targetKeys);
    }

    for (const [workspaceId, targetKeys] of affectedTargets) {
        for (const targetKey of targetKeys) {
            await FindingsService.aggregateRageClicks(workspaceId, targetKey, now);
        }
    }
}

export default class RageClicksDetector {
    public static async detect(processedEvents: Event[]): Promise<void> {
        const workspaceIds = [...new Set(processedEvents.map((event) => event.workspaceId))];
        const clickEvents = processedEvents
            .filter((event) => event.type === "click")
            .sort((left, right) =>
                new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
            );

        for (const event of clickEvents) {
            const targetKey = getTargetKey(event.payload as ClickPayload);
            if (targetKey) {
                await recordEpisode(event, targetKey);
            }
        }

        await closeStaleEpisodes(workspaceIds);
    }
}
