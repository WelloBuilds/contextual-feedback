import { EventType } from "./eventTypes.js";
import type { ClickPayload } from "./clickPayload.js";
import type { PageViewPayload } from "./pageViewPayload.js";
import type { ErrorPayload } from "./errorPayload.js";
import type { FormInputPayload } from "./formInputPayload.js";
import type { FormSubmitPayload } from "./formSubmitPayload.js";
import type { EventContext } from "./eventContext.js";

type EventBase = {
  id: string;
  visitorId: string;
  sessionId: string;
  context: EventContext;
  createdAt: Date;
  deletedAt?: Date | null;
};

export type Event = EventBase & (
  | { type: EventType.click; payload: ClickPayload }
  | { type: EventType.pageView; payload: PageViewPayload }
  | { type: EventType.error; payload: ErrorPayload }
  | { type: EventType.formInput; payload: FormInputPayload }
  | { type: EventType.formSubmit; payload: FormSubmitPayload }
);
