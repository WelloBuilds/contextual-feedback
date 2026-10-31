import type { FindingStatus } from "../enums/findingStatus";
import type { PatternType } from "../../episodes/enums/patternType";
import type { RageClickMetrics } from "./rageClickMetrics";

type FindingBase = {
	id: string;
	workspaceId: string;
	patternType: PatternType;
	affectedVisitorCount: number;
	affectedSessionCount: number;
	episodeCount: number;
	confidence: string;
	status: FindingStatus;
	firstSeenAt: Date;
	lastSeenAt: Date;
	createdAt: Date;
};

export type Finding = FindingBase & (
	| {
		patternType: PatternType.rageClicks;
		targetKey: string;
		metrics: RageClickMetrics;
		evidence: RageClickEvidence;
	}
);

export type RageClickEvidence = {
	episodeIds: string[];
	visitorIds: string[];
	affectedPages: Array<{
		id: string | null;
		path: string;
	}>;
};
