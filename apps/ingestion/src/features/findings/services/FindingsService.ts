import { and, desc, eq, gte, inArray, isNotNull, lte, type SQL } from "drizzle-orm";
import { db } from "../../../db";
import { events } from "../../../models/event.model";
import { episodes } from "../../../models/episode.model";
import { findings } from "../../../models/finding.model";
import EventContextValidator from "../../ingestion/validators/eventContextValidator";
import { FindingStatus } from "../enums/findingStatus";
import { PatternType } from "../../episodes/enums/patternType";
import { EpisodeStatus } from "../../episodes/enums/episodeStatus";
import {
	AGGREGATION_WINDOW_MS,
	MIN_DISTINCT_VISITORS,
	MIN_EPISODES,
} from "../constants/rageClickFindingConstants";
import type { RageClickEvidence } from "../types/findingType";
import type { RageClickMetrics } from "../types/rageClickMetrics";
import type { Episode } from "../../episodes/types/episodeType";

const eventContextSchema = EventContextValidator.context();

function getClickCount(episode: Extract<Episode, { patternType: PatternType.rageClicks }>): number {
	return episode.metrics.clickCount;
}

function buildRageClickMetrics(
	episodes: Array<Extract<Episode, { patternType: PatternType.rageClicks }>>,
): RageClickMetrics {
	const totalClickCount = episodes.reduce((total, episode) => total + getClickCount(episode), 0);
	const averageClicksPerSecond = episodes.reduce((total, episode) => {
		const durationSeconds = Math.max(
			(episode.lastOccurredAt.getTime() - episode.startedAt.getTime()) / 1_000,
			1,
		);
		return total + getClickCount(episode) / durationSeconds;
	}, 0) / episodes.length;

	return { totalClickCount, averageClicksPerSecond: Number(averageClicksPerSecond.toFixed(2)) };
}

async function buildRageClickEvidence(
	episodes: Array<Extract<Episode, { patternType: PatternType.rageClicks }>>,
): Promise<RageClickEvidence> {
	const eventIds = [...new Set(episodes.flatMap((episode) => episode.eventIds))];
	const clickEvents = eventIds.length
		? await db.select({ context: events.context }).from(events).where(inArray(events.id, eventIds))
		: [];
	const affectedPages = new Map<string, RageClickEvidence["affectedPages"][number]>();

	for (const { context } of clickEvents) {
		const result = eventContextSchema.safeParse(context);
		if (result.success) {
			const page = result.data.page;
			affectedPages.set(page.id ?? page.path, page);
		}
	}

	return {
		episodeIds: episodes.map((episode) => episode.id),
		visitorIds: [...new Set(episodes.map((episode) => episode.visitorId))],
		affectedPages: [...affectedPages.values()],
	};
}

export default class FindingsService {
	// ------------------------------------------------------------
	// MARK: List Findings
	// ------------------------------------------------------------
	public static async list(workspaceId: string, status?: FindingStatus) {
		const conditions: SQL[] = [eq(findings.workspaceId, workspaceId)];
		if (status) conditions.push(eq(findings.status, status));

		return db.select().from(findings).where(and(...conditions)).orderBy(findings.lastSeenAt);
	}

	// ------------------------------------------------------------
	// MARK: Update Finding Status
	// ------------------------------------------------------------
	public static async updateStatus(id: string, status: FindingStatus) {
		const [updated] = await db.update(findings).set({ status }).where(eq(findings.id, id)).returning();
		return updated ?? null;
	}

	// ------------------------------------------------------------
	// MARK: Aggregate Rage Click Episodes
	// ------------------------------------------------------------
	public static async aggregateRageClicks(
		workspaceId: string,
		targetKey: string,
		aggregationTime = new Date(),
	): Promise<void> {
		const windowStart = new Date(aggregationTime.getTime() - AGGREGATION_WINDOW_MS);
		const episodeRecords = await db.select().from(episodes).where(and(
			eq(episodes.workspaceId, workspaceId),
			eq(episodes.patternType, PatternType.rageClicks),
			eq(episodes.targetKey, targetKey),
			eq(episodes.status, EpisodeStatus.closed),
			isNotNull(episodes.startedAt),
			isNotNull(episodes.lastOccurredAt),
			gte(episodes.startedAt, windowStart),
			lte(episodes.startedAt, aggregationTime),
		));
		const matchingEpisodes = episodeRecords as Array<
			Extract<Episode, { patternType: PatternType.rageClicks }>
		>;

		const visitorIds = new Set(matchingEpisodes.map((episode) => episode.visitorId));
		if (matchingEpisodes.length < MIN_EPISODES || visitorIds.size < MIN_DISTINCT_VISITORS) return;

		const metrics = buildRageClickMetrics(matchingEpisodes);
		const confidence = (
			Math.min(visitorIds.size / 10, 1) * 0.45 +
			Math.min(matchingEpisodes.length / 20, 1) * 0.35 +
			Math.min(metrics.averageClicksPerSecond / 5, 1) * 0.2
		).toFixed(2);
		const firstSeenAt = new Date(Math.min(...matchingEpisodes.map((episode) => episode.startedAt.getTime())));
		const lastSeenAt = new Date(Math.max(...matchingEpisodes.map((episode) => episode.lastOccurredAt.getTime())));
		const evidence = await buildRageClickEvidence(matchingEpisodes);
		const [existingFinding] = await db.select().from(findings).where(and(
			eq(findings.workspaceId, workspaceId),
			eq(findings.patternType, PatternType.rageClicks),
			eq(findings.targetKey, targetKey),
		)).orderBy(desc(findings.lastSeenAt)).limit(1);

		if (existingFinding) {
			await db.update(findings).set({
				metrics,
				evidence,
				affectedVisitorCount: visitorIds.size,
				affectedSessionCount: new Set(matchingEpisodes.map((episode) => episode.sessionId)).size,
				episodeCount: matchingEpisodes.length,
				confidence,
				firstSeenAt,
				lastSeenAt,
			}).where(eq(findings.id, existingFinding.id));
			return;
		}

		await db.insert(findings).values({
			id: crypto.randomUUID(),
			workspaceId,
			patternType: PatternType.rageClicks,
			targetKey,
			evidence,
			metrics,
			affectedVisitorCount: visitorIds.size,
			affectedSessionCount: new Set(matchingEpisodes.map((episode) => episode.sessionId)).size,
			episodeCount: matchingEpisodes.length,
			confidence,
			status: FindingStatus.candidate,
			firstSeenAt,
			lastSeenAt,
		}).onConflictDoNothing();
	}
}
