import { EventType } from "./eventTypes.js";
import type { ClickEvent } from "./clickEvent.js";
export type Event = {
    id: string;
    type: EventType;
    payload: ClickEvent;
    createdAt: Date;
    deletedAt?: Date | null;
};
