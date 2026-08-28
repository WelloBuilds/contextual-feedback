import { EventType, PageView, PageViewTypes, Event } from "../events";

export const pageViewDetector = () => {
  let previousUrl = window.location.href;

  const originalPushState = window.history.pushState;

  window.history.pushState = function (...args) {
    const currentUrl = window.location.href;

    const targetUrl =
      args[2] == null ? currentUrl : new URL(args[2], currentUrl).href;

    const pageViewPayload: PageView = {
      previousUrl: currentUrl,
      targetUrl,
      type: PageViewTypes.pushState,
    };

    const feedbackEvent: Event = {
      id: crypto.randomUUID(),
      type: EventType.pageView,
      payload: pageViewPayload,
      createdAt: new Date(),
    };

    console.log(feedbackEvent);

    const result = originalPushState.apply(this, args);

    previousUrl = window.location.href;

    return result;
  };

  window.addEventListener("popstate", () => {
    const targetUrl = window.location.href;

    const pageViewPayload: PageView = {
      previousUrl,
      targetUrl,
      type: PageViewTypes.popState,
    };

    const feedbackEvent: Event = {
      id: crypto.randomUUID(),
      type: EventType.pageView,
      payload: pageViewPayload,
      createdAt: new Date(),
    };

    console.log(feedbackEvent);

    previousUrl = targetUrl;
  });
};
