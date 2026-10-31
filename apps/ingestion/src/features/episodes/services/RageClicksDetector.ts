import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../../../db";
import { episodes } from "../../../models/episode.model";
import { events } from "../../../models/event.model";
import type { Event } from "../../ingestion/types/eventType";
import { EventType } from "../../ingestion/enums/eventType";
import {
	EPISODE_INACTIVITY_MS,
	MAX_CLICK_GAP_MS,
	MAX_EPISODE_DURATION_MS,
	MIN_CLICKS,
	RAGE_WINDOW_MS,
} from "../constants/rageClickConstants";
import { EpisodeStatus } from "../enums/episodeStatus";
import { PatternType } from "../enums/patternType";
import FindingsService from "../../findings/services/FindingsService";
import type { ClickPayload } from "../../ingestion/types/clickPayloadType";
import EpisodesValidator from "../validators/episodesValidator";

const GENERATED_CLASS_PATTERN = /\d{4,}|^[a-f0-9]{8,}$/i;
const CSS_IN_JS_CLASS_PATTERN = /^css-|^sc-/i;

function getTargetKey(payload: ClickPayload): string | null {
	if (payload.ignoredForRage || payload.isTrusted === false) return null;
	if (payload.targetId?.trim()) return `customer:${payload.targetId.trim()}`;

	if (payload.role || payload.accessibleName) {
		return [
			"semantic",
			payload.tagName ?? "",
			payload.role ?? "",
			payload.accessibleName ?? "",
			payload.fingerprint ?? "",
		].join(":");
	}

	if (payload.fingerprint) return `fingerprint:${payload.fingerprint}`;

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

	if (tagName && classNames) return `dom:${tagName}:${classNames}`;
	return `position:${Math.round(payload.x / 30)}:${Math.round(payload.y / 30)}`;
}

function isRageClickBurst(timestamps: Date[]): boolean {
	if (timestamps.length < MIN_CLICKS) return false;

	const milliseconds = timestamps.map((timestamp) => timestamp.getTime());
	const duration = milliseconds[milliseconds.length - 1] - milliseconds[0];
	const gaps = milliseconds.slice(1).map((time, index) => time - milliseconds[index]);

	return duration <= RAGE_WINDOW_MS && gaps.every((gap) => gap <= MAX_CLICK_GAP_MS);
}

async function getConsecutiveClicks(event: Event, targetKey: string) {
	const eventTime = new Date(event.createdAt);
	const recentClicks = await db
		.select()
		.from(events)
		.where(and(
			eq(events.workspaceId, event.workspaceId),
			eq(events.visitorId, event.visitorId),
			eq(events.type, EventType.click),
			gte(events.createdAt, new Date(eventTime.getTime() - RAGE_WINDOW_MS)),
			lte(events.createdAt, eventTime),
		));

	const orderedClicks = recentClicks.sort((left, right) =>
		left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id),
	);
	const currentClickIndex = orderedClicks.findIndex((click) => click.id === event.id);
	const clicks = [];

	for (let index = currentClickIndex; index >= 0; index -= 1) {
		const click = orderedClicks[index];
		if (getTargetKey(click.payload as ClickPayload) !== targetKey) break;
		clicks.unshift(click);
	}

	return clicks;
}

async function recordEpisode(event: Event, targetKey: string): Promise<void> {
	const clicks = await getConsecutiveClicks(event, targetKey);
	if (!isRageClickBurst(clicks.map((click) => click.createdAt))) return;

	const firstClick = clicks[0];
	const lastClick = clicks[clicks.length - 1];
	const currentEventIds = clicks.map((click) => click.id);
	const activeEpisodes = await db
		.select()
		.from(episodes)
		.where(and(
			eq(episodes.workspaceId, event.workspaceId),
			eq(episodes.visitorId, event.visitorId),
			eq(episodes.patternType, PatternType.rageClicks),
			eq(episodes.targetKey, targetKey),
			eq(episodes.status, EpisodeStatus.active),
		))
		.limit(1);

	if (activeEpisodes.length > 0) {
		const activeEpisode = activeEpisodes[0];
		const isSameEpisode = Boolean(activeEpisode.startedAt && activeEpisode.lastOccurredAt &&
			lastClick.createdAt.getTime() - activeEpisode.lastOccurredAt.getTime() <= EPISODE_INACTIVITY_MS &&
			lastClick.createdAt.getTime() - activeEpisode.startedAt.getTime() <= MAX_EPISODE_DURATION_MS);

		if (isSameEpisode) {
			const eventIds = [...new Set([...activeEpisode.eventIds, ...currentEventIds])];
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
				.where(eq(episodes.id, activeEpisode.id));
			return;
		}

		await db
			.update(episodes)
			.set({ status: EpisodeStatus.closed, closedAt: new Date() })
			.where(eq(episodes.id, activeEpisode.id));
		await FindingsService.aggregateRageClicks(event.workspaceId, targetKey);
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
		detectedAt: event.createdAt,
		closedAt: null,
		metrics: {
			patternType: PatternType.rageClicks,
			clickCount: currentEventIds.length,
		},
		eventIds: currentEventIds,
	});

	await db.insert(episodes).values(episode);
}

async function closeStaleEpisodes(workspaceId: string): Promise<void> {
	const now = new Date();
	const staleBefore = new Date(now.getTime() - EPISODE_INACTIVITY_MS);
	const closedEpisodes = await db
		.update(episodes)
		.set({ status: EpisodeStatus.closed, closedAt: now })
		.where(and(
			eq(episodes.workspaceId, workspaceId),
			eq(episodes.patternType, PatternType.rageClicks),
			eq(episodes.status, EpisodeStatus.active),
			lte(episodes.lastOccurredAt, staleBefore),
		))
		.returning({ targetKey: episodes.targetKey });

	const targetKeys = new Set(closedEpisodes.flatMap(({ targetKey }) => targetKey ? [targetKey] : []));
	for (const targetKey of targetKeys) {
		await FindingsService.aggregateRageClicks(workspaceId, targetKey, now);
	}
}

export default class RageClicksDetector {
	// ------------------------------------------------------------
	// MARK: Detect Rage Clicks
	// ------------------------------------------------------------
	public static async detect(processedEvents: Event[]): Promise<void> {
		const workspaceId = processedEvents[0].workspaceId;
		const clickEvents = processedEvents
			.filter((event) => event.type === EventType.click)
			.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

		for (const event of clickEvents) {
			const targetKey = getTargetKey(event.payload);
			if (targetKey) await recordEpisode(event, targetKey);
		}

		await closeStaleEpisodes(workspaceId);
	}
}
