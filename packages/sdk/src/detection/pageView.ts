import { getVisitorId } from "../auth/visitorId";
import { getEventContext } from "../events/eventContext.js";
import { EventType, PageViewTypes, Event, PageViewPayload } from "../events";
import { EventQueue } from "../queue/eventQueue";
import { SessionManager } from "../session/sessionManager";

export const pageViewDetector = (eventQueue : EventQueue, sessionManager: SessionManager) => {
  let previousUrl = window.location.href;

  const originalPushState = window.history.pushState;

  window.history.pushState = function (...args) {
    const currentUrl = window.location.href;
    const result = originalPushState.apply(this, args);
    const targetUrl = window.location.href;

    const pageViewPayload: PageViewPayload = {
      previousUrl: currentUrl,
      targetUrl,
      type: PageViewTypes.pushState,
    };

    const sessionId = sessionManager.newActivity()
    const visitorId = getVisitorId()

    const feedbackEvent: Event = {
      id: crypto.randomUUID(),
      visitorId: visitorId,
      sessionId: sessionId,
      context: getEventContext(),
      type: EventType.pageView,
      payload: pageViewPayload,
      createdAt: new Date(),
    };

    eventQueue.add(feedbackEvent);
    previousUrl = window.location.href;

    return result;
  };

  window.addEventListener("popstate", () => {
    const targetUrl = window.location.href;

    const pageViewPayload: PageViewPayload = {
      previousUrl,
      targetUrl,
      type: PageViewTypes.popState,
    };

    const sessionId = sessionManager.newActivity();
    const visitorId = getVisitorId()

    const feedbackEvent: Event = {
      id: crypto.randomUUID(),
      visitorId: visitorId,
      sessionId: sessionId,
      context: getEventContext(),
      type: EventType.pageView,
      payload: pageViewPayload,
      createdAt: new Date(),
    };

    eventQueue.add(feedbackEvent);

    previousUrl = targetUrl;
  });
};
