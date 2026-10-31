import { EventType } from "../enums/eventType";
import { ClickPayload } from "./clickPayloadType";
import { ErrorPayload } from "./errorPayloadType";
import { FormInputPayload } from "./formInputPayloadType";
import { FormSubmitPayload } from "./formSubmitPayload";
import { PageViewPayload } from "./pageViewPayloadType";

export type EventContext = {
    page: {
        id: string | null;
        path: string;
    };
};

type EventBase = {
    id: string;
    visitorId: string;
    workspaceId: string;
    sessionId: string;
    createdAt: Date;
    context?: EventContext;
};

export type Event = EventBase & (
    | { type: EventType.click; payload: ClickPayload }
    | { type: EventType.error; payload: ErrorPayload }
    | { type: EventType.formInput; payload: FormInputPayload }
    | { type: EventType.formSubmit; payload: FormSubmitPayload }
    | { type: EventType.pageView; payload: PageViewPayload }
);
