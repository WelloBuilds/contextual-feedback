import { EventType } from "../events/eventTypes.js";
import { FormSubmitPayload } from "../events/formSubmitPayload.js";
import { Event } from "../events/event.js";

export const formSubmit = () => {
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
      type: EventType.formSubmit,
      payload: formSubmitPayload,
      createdAt: new Date(),
    };
    console.log("feedbackEvent", feedbackEvent);
  });
};