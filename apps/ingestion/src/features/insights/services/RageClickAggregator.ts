import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../../db";
import { findings } from "../../../models/finding.model";
import { rageClickEpisodes } from "../../../models/rageClickEpisode.model";
import {
    AGGREGATION_WINDOW_MS,
    MIN_DISTINCT_VISITORS,
    MIN_EPISODES,
} from "../constants/rageClickConstants";
import type { RageClickEvidence, RageClickMetrics } from "../types/findingType";

type EpisodeRecord = typeof rageClickEpisodes.$inferSelect;

function buildMetrics(episodes: EpisodeRecord[]): RageClickMetrics {
    const totalClicks = episodes.reduce((total, episode) => total + episode.clickCount, 0);
    const visitorIds = new Set(episodes.map((episode) => episode.visitorId));
    const sessionIds = new Set(
        episodes
            .map((episode) => episode.sessionId)
            .filter((sessionId): sessionId is string => sessionId !== null),
    );

    return {
        affectedVisitorCount: visitorIds.size,
        affectedSessionCount: sessionIds.size,
        episodeCount: episodes.length,
        totalClickCount: totalClicks,
        averageClicksPerEpisode: Number((totalClicks / episodes.length).toFixed(2)),
    };
}

function buildEvidence(episodes: EpisodeRecord[]): RageClickEvidence {
    const visitorIds = [...new Set(episodes.map((episode) => episode.visitorId))];

    return {
        episodeIds: episodes.map((episode) => episode.id),
        sampleVisitorIds: visitorIds.slice(0, 5),
    };
}

function getSeenRange(episodes: EpisodeRecord[]): { firstSeenAt: Date; lastSeenAt: Date } {
    const startTimes = episodes.map((episode) => episode.startedAt.getTime());
    const endTimes = episodes.map((episode) => episode.endedAt.getTime());

    return {
        firstSeenAt: new Date(Math.min(...startTimes)),
        lastSeenAt: new Date(Math.max(...endTimes)),
    };
}

async function getEligibleEpisodes(
    workspaceId: string,
    targetKey: string,
    asOf: Date,
): Promise<EpisodeRecord[]> {
    const windowStart = new Date(asOf.getTime() - AGGREGATION_WINDOW_MS);

    return db
        .select()
        .from(rageClickEpisodes)
        .where(and(
            eq(rageClickEpisodes.workspaceId, workspaceId),
            eq(rageClickEpisodes.targetKey, targetKey),
            eq(rageClickEpisodes.status, "closed"),
            gte(rageClickEpisodes.startedAt, windowStart),
            lte(rageClickEpisodes.startedAt, asOf),
        ));
}

async function getExistingFinding(workspaceId: string, targetKey: string) {
    const [finding] = await db
        .select()
        .from(findings)
        .where(and(
            eq(findings.workspaceId, workspaceId),
            eq(findings.patternType, "rage_clicks"),
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
        asOf = new Date(),
    ): Promise<void> {
        const episodes = await getEligibleEpisodes(workspaceId, targetKey, asOf);
        if (episodes.length < MIN_EPISODES) {
            return;
        }

        const metrics = buildMetrics(episodes);
        if (metrics.affectedVisitorCount < MIN_DISTINCT_VISITORS) {
            return;
        }

        const evidence = buildEvidence(episodes);
        const { firstSeenAt, lastSeenAt } = getSeenRange(episodes);
        const existingFinding = await getExistingFinding(workspaceId, targetKey);

        if (existingFinding) {
            await db
                .update(findings)
                .set({
                    metrics,
                    evidence,
                    confidence: null,
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
                visitorId: null,
                sessionId: null,
                patternType: "rage_clicks",
                targetKey,
                evidence,
                metrics,
                confidence: null,
                status: "candidate",
                firstSeenAt,
                lastSeenAt,
            })
            .onConflictDoNothing();
    }
}
