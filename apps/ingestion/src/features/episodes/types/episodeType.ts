import type { PatternType } from "./patternType";

export const EpisodeStatus = {
    active: "active",
    closed: "closed",
} as const;

export type EpisodeStatus = typeof EpisodeStatus[keyof typeof EpisodeStatus];

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
