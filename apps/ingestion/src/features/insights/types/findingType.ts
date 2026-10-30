import type { FindingStatus } from "../enums/findingStatus";
import type { PatternType } from "../enums/patternType";

export type Finding = {
    id: string;
    workspaceId: string;
    visitorId: string | null;
    sessionId: string | null;
    patternType: PatternType;
    targetKey: string | null;
    evidence: Record<string, unknown>;
    metrics: Record<string, unknown>;
    confidence: string | null;
    status: FindingStatus;
    firstSeenAt: Date;
    lastSeenAt: Date;
    createdAt: Date;
};

export type RageClickMetrics = {
    affectedVisitorCount: number;
    affectedSessionCount: number;
    episodeCount: number;
    totalClickCount: number;
    averageClicksPerEpisode: number;
};

export type RageClickEvidence = {
    episodeIds: string[];
    sampleVisitorIds: string[];
};
