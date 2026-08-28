import { EventType } from "./eventTypes.js";
import type { ClickEvent } from "./clickEvent.js";
import type { PageView } from "./pageView.js";

export type Event = {
  id: string;
  type: EventType;
  payload: ClickEvent | PageView;
  createdAt: Date;
  deletedAt?: Date | null;
};
