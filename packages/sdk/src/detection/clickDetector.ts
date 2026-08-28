import { ClickEvent } from "../events/clickEvent.js";
import { EventType } from "../events/eventTypes.js";
import { Event } from "../events/event.js";

export const clickDetector = () => {
  document.addEventListener("click", (e) => {
    const target = e.target;
    const targetId =
      e.target instanceof HTMLElement && e.target.id ? e.target.id : null;

    const clickPayload: ClickEvent = {
      target: targetId,
      x: e.pageX,
      y: e.pageY,
    };

    const feedbackEvent: Event = {
      id: crypto.randomUUID(),
      type: EventType.click,
      payload: clickPayload,
      createdAt: new Date(),
    };
    console.log(feedbackEvent);
  });
};
