import { PageViewTypes } from "../enums/pageViewType";

export type PageViewPayload = {
    previousUrl: string;
    targetUrl: string;
    type?: PageViewTypes | null;
}