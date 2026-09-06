import { ClickPayload } from "../events/clickPayload.js";
import { EventType } from "../events/eventTypes.js";
import { Event } from "../events/event.js";
import { EventQueue } from "../queue/eventQueue.js";
import { SessionManager } from "../session/sessionManager.js";

export const clicks = (eventQueue : EventQueue, sessionManager : SessionManager) => {
  document.addEventListener("click", (e) => {
    
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const interactionTarget = target.closest("button, a, input, select, textarea") ?? target;

    const clickPayload: ClickPayload = {
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
    
    eventQueue.add(feedbackEvent)
    sessionManager.newActivity()

  });
};
