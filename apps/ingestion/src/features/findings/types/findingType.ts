import type { FindingStatus } from "../enums/findingStatus";
import type { PatternType } from "../../episodes/enums/patternType";
import type { RageClickMetrics } from "./rageClickMetrics";

type FindingBase = {
    id: string;
    workspaceId: string;
    targetKey: string | null;
    evidence: Record<string, unknown>;
    affectedVisitorCount: number;
    affectedSessionCount: number;
    episodeCount: number;
    confidence: string;
    status: FindingStatus;
    firstSeenAt: Date;
    lastSeenAt: Date;
    createdAt: Date;
};

export type PatternMetrics = {
    [PatternType.rageClicks]: RageClickMetrics;
};

export type Finding = {
    [CurrentPatternType in keyof PatternMetrics]: FindingBase & {
        patternType: CurrentPatternType;
        metrics: PatternMetrics[CurrentPatternType];
    };
}[keyof PatternMetrics];

export type RageClickEvidence = {
    episodeIds: string[];
    visitorIds: string[];
    affectedPages: Array<{
        id: string | null;
        path: string;
    }>;
};
