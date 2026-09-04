import { EventType } from "./eventTypes.js";
import type { ClickPayload } from "./clickPayload.js";
import type { PageViewPayload } from "./pageViewPayload.js";
import type { ErrorPayload } from "./errorPayload.js";
import type { FormInputPayload } from "./formInputPayload.js";

export type Event = {
  id: string;
  type: EventType;
  payload: ClickPayload | PageViewPayload | ErrorPayload | FormInputPayload;
  createdAt: Date;
  deletedAt?: Date | null;
};
