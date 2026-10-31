import type { EpisodeStatus } from "../enums/episodeStatus";
import type { PatternType } from "../enums/patternType";

export type RageClickEpisodeMetrics = {
    patternType: PatternType.rageClicks;
    clickCount: number;
};

type EpisodeBase = {
    id: string;
    workspaceId: string;
    visitorId: string;
    sessionId: string;
    status: EpisodeStatus;
    startedAt: Date;
    lastOccurredAt: Date;
    detectedAt: Date;
    closedAt: Date | null;
    eventIds: string[];
    createdAt: Date;
};

export type RageClickEpisode = EpisodeBase & {
    patternType: PatternType.rageClicks;
    targetKey: string;
    metrics: RageClickEpisodeMetrics;
};

export type Episode = RageClickEpisode;
