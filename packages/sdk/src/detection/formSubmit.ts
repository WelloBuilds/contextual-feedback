import { EventType } from "../events/eventTypes.js";
import { FormSubmitPayload } from "../events/formSubmitPayload.js";
import { Event } from "../events/event.js";
import { EventQueue } from "../queue/eventQueue.js";
import { SessionManager } from "../session/sessionManager.js";

export const formSubmit = (eventQueue : EventQueue, sessionManager: SessionManager) => {

  const sessionId = sessionManager.newActivity();

  document.addEventListener("submit", (e) => {
    const target = e.target;

    if (!(target instanceof HTMLFormElement)) {
      return;
    }
    const formSubmitPayload: FormSubmitPayload = {
      id: target.id,
      name: target.name,
      action: target.action,
      method: target.method,
    };
    const feedbackEvent: Event = {
      id: crypto.randomUUID(),
      sessionId: sessionId,
      type: EventType.formSubmit,
      payload: formSubmitPayload,
      createdAt: new Date(),
    };
    eventQueue.add(feedbackEvent);
    sessionManager.newActivity()
  });
};