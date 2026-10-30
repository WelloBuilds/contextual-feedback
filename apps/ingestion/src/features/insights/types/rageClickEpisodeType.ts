export type RageClickEpisode = {
    id: string;
    workspaceId: string;
    visitorId: string;
    sessionId: string | null;
    targetKey: string;
    clickCount: number;
    startedAt: Date;
    endedAt: Date;
    lastClickAt: Date;
    detectedAt: Date;
    status: "active" | "closed";
    eventIds: string[];
    createdAt: Date;
};
