import { EventType } from "../events/eventTypes.js";
import { getEventContext } from "../events/eventContext.js";
import { FormInputPayload } from "../events/formInputPayload.js";
import { Event } from "../events/event.js";
import { EventQueue } from "../queue/eventQueue.js";
import { SessionManager } from "../session/sessionManager.js";
import { getVisitorId } from "../auth/visitorId.js";

export const formInput = (eventQueue : EventQueue, sessionManager:SessionManager) => {
  document.addEventListener("change", (e) => {
    const target = e.target;

    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLTextAreaElement) &&
      !(target instanceof HTMLSelectElement)
    ) {
      return;
    }

    const formInputPayload: FormInputPayload = {
      id: target.id,
      name: target.name,
      type: target.type,
      tagName: target.tagName,
    };

    const sessionId = sessionManager.newActivity()
    const visitorId = getVisitorId()

    const feedbackEvent: Event = {
      id: crypto.randomUUID(),
      visitorId: visitorId,
      sessionId: sessionId,
      context: getEventContext(),
      type: EventType.formInput,
      payload: formInputPayload,
      createdAt: new Date(),
    };

    eventQueue.add(feedbackEvent);

  });
};
