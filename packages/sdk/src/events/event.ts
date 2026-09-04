import { EventType } from "./eventTypes.js";
import type { ClickPayload } from "./clickPayload.js";
import type { PageViewPayload } from "./pageViewPayload.js";
import type { ErrorPayload } from "./errorPayload.js";

export type Event = {
  id: string;
  type: EventType;
  payload: ClickPayload | PageViewPayload | ErrorPayload;
  createdAt: Date;
  deletedAt?: Date | null;
};
