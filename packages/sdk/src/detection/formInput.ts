import { EventType } from "../events/eventTypes.js";
import { FormInputPayload } from "../events/formInputPayload.js";
import { Event } from "../events/event.js";
import { EventQueue } from "../queue/eventQueue.js";

export const formInput = (eventQueue : EventQueue) => {
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

    const feedbackEvent: Event = {
      id: crypto.randomUUID(),
      type: EventType.formInput,
      payload: formInputPayload,
      createdAt: new Date(),
    };

    eventQueue.add(feedbackEvent);
  });
};