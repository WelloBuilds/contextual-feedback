export type InitOptions = {
    workspaceId: string;
};
export type FeedbackConfig = InitOptions;
declare let config: FeedbackConfig | null;
declare function init(options: FeedbackConfig): void;
export declare const Feedback: {
    init: typeof init;
};
export { config };
