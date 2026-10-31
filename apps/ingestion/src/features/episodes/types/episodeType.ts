import type { EpisodeStatus } from "../enums/episodeStatus";
import type { PatternType } from "../enums/patternType";
import type { RageClickEpisodeMetric } from "./rageClickEpisodeMetric";

type EpisodeBase = {
	id: string;
	workspaceId: string;
	visitorId: string;
	sessionId: string;
	patternType: PatternType;
	status: EpisodeStatus;
	detectedAt: Date;
	deletedAt: Date | null;
	eventIds: string[];
	createdAt: Date;
};

export type Episode = EpisodeBase & (
	| {
		patternType: PatternType.rageClicks;
		targetKey: string;
		startedAt: Date;
		lastOccurredAt: Date;
		closedAt: Date | null;
		metrics: RageClickEpisodeMetric;
	}
	| {
		patternType: PatternType.errorAfterClick;
	}
);
