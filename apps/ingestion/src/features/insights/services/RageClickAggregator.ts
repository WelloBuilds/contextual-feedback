import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../../../db";
import { events } from "../../../models/event.model";
import { findings } from "../../../models/finding.model";
import { episodes } from "../../../models/episode.model";
import {
    AGGREGATION_WINDOW_MS,
    MIN_DISTINCT_VISITORS,
    MIN_EPISODES,
} from "../constants/rageClickConstants";
import { PatternType } from "../enums/patternType";
import { FindingStatus } from "../enums/findingStatus";
import type { RageClickEvidence } from "../types/findingType";
import type { RageClickMetrics } from "../types/rageClickMetrics";
import EventContextValidator from "../../ingestion/validators/eventContextValidator";

type EpisodeRecord = typeof episodes.$inferSelect;
const eventContextSchema = EventContextValidator.context();

function getClickCount(episode: EpisodeRecord): number {
    const clickCount = episode.metrics.clickCount;
    return typeof clickCount === "number" ? clickCount : 0;
}

function buildMetrics(episodes: EpisodeRecord[]): RageClickMetrics {
    const totalClicks = episodes.reduce((total, episode) => total + getClickCount(episode), 0);
    const episodeClickRates = episodes.map((episode) => {
        const durationSeconds = Math.max(
            (episode.lastOccurredAt.getTime() - episode.startedAt.getTime()) / 1_000,
            1,
        );
        return getClickCount(episode) / durationSeconds;
    });
    const averageClicksPerSecond = episodeClickRates.reduce((sum, rate) => sum + rate, 0) / episodes.length;

    return {
        totalClickCount: totalClicks,
        averageClicksPerSecond: Number(averageClicksPerSecond.toFixed(2)),
    };
}

function countDistinctVisitors(episodes: EpisodeRecord[]): number {
    return new Set(episodes.map((episode) => episode.visitorId)).size;
}

function countDistinctSessions(episodes: EpisodeRecord[]): number {
    return new Set(episodes.map((episode) => episode.sessionId)).size;
}

function calculateConfidence(
    visitorCount: number,
    episodeCount: number,
    averageClicksPerSecond: number,
): string {
    const visitorEvidence = Math.min(visitorCount / 10, 1) * 0.45;
    const episodeEvidence = Math.min(episodeCount / 20, 1) * 0.35;
    const speedEvidence = Math.min(averageClicksPerSecond / 5, 1) * 0.2;
    return (visitorEvidence + episodeEvidence + speedEvidence).toFixed(2);
}

async function getAffectedPages(episodes: EpisodeRecord[]): Promise<RageClickEvidence["affectedPages"]> {
    const eventIds = [...new Set(episodes.flatMap((episode) => episode.eventIds))];
    if (eventIds.length === 0) {
        return [];
    }

    const clickEvents = await db
        .select({ context: events.context })
        .from(events)
        .where(inArray(events.id, eventIds));
    const pages = new Map<string, RageClickEvidence["affectedPages"][number]>();

    for (const { context } of clickEvents) {
        const result = eventContextSchema.safeParse(context);
        if (result.success) {
            const { page } = result.data;
            pages.set(page.id ?? page.path, page);
        }
    }

    return [...pages.values()];
}

async function buildEvidence(episodes: EpisodeRecord[]): Promise<RageClickEvidence> {
    const visitorIds = [...new Set(episodes.map((episode) => episode.visitorId))];

    return {
        episodeIds: episodes.map((episode) => episode.id),
        visitorIds,
        affectedPages: await getAffectedPages(episodes),
    };
}

function getSeenRange(episodes: EpisodeRecord[]): { firstSeenAt: Date; lastSeenAt: Date } {
    const startTimes = episodes.map((episode) => episode.startedAt.getTime());
    const endTimes = episodes.map((episode) => episode.lastOccurredAt.getTime());

    return {
        firstSeenAt: new Date(Math.min(...startTimes)),
        lastSeenAt: new Date(Math.max(...endTimes)),
    };
}

async function getEligibleEpisodes(
    workspaceId: string,
    targetKey: string,
    aggregationTime: Date,
): Promise<EpisodeRecord[]> {
    const windowStart = new Date(aggregationTime.getTime() - AGGREGATION_WINDOW_MS);

    return db
        .select()
        .from(episodes)
        .where(and(
            eq(episodes.workspaceId, workspaceId),
            eq(episodes.patternType, PatternType.rageClicks),
            eq(episodes.targetKey, targetKey),
            eq(episodes.status, "closed"),
            gte(episodes.startedAt, windowStart),
            lte(episodes.startedAt, aggregationTime),
        ));
}

async function getExistingFinding(workspaceId: string, targetKey: string) {
    const [finding] = await db
        .select()
        .from(findings)
        .where(and(
            eq(findings.workspaceId, workspaceId),
            eq(findings.patternType, PatternType.rageClicks),
            eq(findings.targetKey, targetKey),
        ))
        .orderBy(desc(findings.lastSeenAt))
        .limit(1);

    return finding;
}

export default class RageClickAggregator {
    public static async aggregate(
        workspaceId: string,
        targetKey: string,
        aggregationTime = new Date(),
    ): Promise<void> {
        const episodes = await getEligibleEpisodes(workspaceId, targetKey, aggregationTime);
        if (episodes.length < MIN_EPISODES) {
            return;
        }

        const affectedVisitorCount = countDistinctVisitors(episodes);
        if (affectedVisitorCount < MIN_DISTINCT_VISITORS) {
            return;
        }

        const affectedSessionCount = countDistinctSessions(episodes);
        const metrics = buildMetrics(episodes);
        const confidence = calculateConfidence(
            affectedVisitorCount,
            episodes.length,
            metrics.averageClicksPerSecond,
        );
        const evidence = await buildEvidence(episodes);
        const { firstSeenAt, lastSeenAt } = getSeenRange(episodes);
        const existingFinding = await getExistingFinding(workspaceId, targetKey);

        if (existingFinding) {
            await db
                .update(findings)
                .set({
                    metrics,
                    evidence,
                    affectedVisitorCount,
                    affectedSessionCount,
                    episodeCount: episodes.length,
                    confidence,
                    firstSeenAt,
                    lastSeenAt,
                })
                .where(eq(findings.id, existingFinding.id));
            return;
        }

        await db
            .insert(findings)
            .values({
                id: crypto.randomUUID(),
                workspaceId,
                patternType: PatternType.rageClicks,
                targetKey,
                evidence,
                metrics,
                affectedVisitorCount,
                affectedSessionCount,
                episodeCount: episodes.length,
                confidence,
                status: FindingStatus.candidate,
                firstSeenAt,
                lastSeenAt,
            })
            .onConflictDoNothing();
    }
}
