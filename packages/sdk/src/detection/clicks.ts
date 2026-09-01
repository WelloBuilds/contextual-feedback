import { ClickEvent } from "../events/clickEvent.js";
import { EventType } from "../events/eventTypes.js";
import { Event } from "../events/event.js";

export const clicks = () => {
  document.addEventListener("click", (e) => {
    
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const interactionTarget = target.closest("button, a, input, select, textarea") ?? target;

    const clickPayload: ClickEvent = {
      id: interactionTarget.id ,
      className : interactionTarget.className ,
      tagName : interactionTarget.tagName,
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
