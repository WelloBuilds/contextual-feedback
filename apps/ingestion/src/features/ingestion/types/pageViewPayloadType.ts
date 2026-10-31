import { PageViewTypes } from "../enums/pageViewType";

export type PageViewPayload = {
    previousPath: string;
    targetPath: string;
    type?: PageViewTypes | null;
}
