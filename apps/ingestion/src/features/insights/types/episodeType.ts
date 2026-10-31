import type { PatternType } from "../enums/patternType";

export const EpisodeStatus = {
    active: "active",
    closed: "closed",
} as const;

export type EpisodeStatus = typeof EpisodeStatus[keyof typeof EpisodeStatus];

export type Episode = {
    id: string;
    workspaceId: string;
    visitorId: string;
    sessionId: string;
    patternType: PatternType;
    targetKey: string | null;
    status: EpisodeStatus;
    startedAt: Date;
    lastOccurredAt: Date;
    detectedAt: Date;
    closedAt: Date | null;
    metrics: Record<string, unknown>;
    evidence: Record<string, unknown>;
    eventIds: string[];
    createdAt: Date;
};
