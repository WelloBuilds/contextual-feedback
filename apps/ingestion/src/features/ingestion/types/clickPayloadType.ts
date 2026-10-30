export type ClickPayload = {
    id: string | null;
    className: string | null;
    tagName: string | null;
    x: number;
    y: number;
    targetId?: string | null;
    role?: string | null;
    accessibleName?: string | null;
    fingerprint?: string | null;
    ignoredForRage?: boolean;
    isTrusted?: boolean;
};
