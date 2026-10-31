import { getVisitorId } from "../auth/visitorId";
import { getEventContext } from "../events/eventContext.js";
import { EventType, PageViewTypes, Event, PageViewPayload } from "../events";
import { EventQueue } from "../queue/eventQueue";
import { SessionManager } from "../session/sessionManager";

export const pageViewDetector = (eventQueue : EventQueue, sessionManager: SessionManager) => {
  let previousPath = window.location.pathname;

  const originalPushState = window.history.pushState;

  window.history.pushState = function (...args) {
    const currentPath = window.location.pathname;
    const result = originalPushState.apply(this, args);
    const targetPath = window.location.pathname;

    const pageViewPayload: PageViewPayload = {
      previousPath: currentPath,
      targetPath,
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
    previousPath = targetPath;

    return result;
  };

  window.addEventListener("popstate", () => {
    const targetPath = window.location.pathname;

    const pageViewPayload: PageViewPayload = {
      previousPath,
      targetPath,
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

    previousPath = targetPath;
  });
};
