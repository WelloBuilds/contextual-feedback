import { getVisitorId } from "../auth/visitorId.js";
import { EventType } from "../events/eventTypes.js";
import type { ClickPayload } from "../events/clickPayload.js";
import type { Event } from "../events/event.js";
import { EventQueue } from "../queue/eventQueue.js";
import { SessionManager } from "../session/sessionManager.js";

const INTERACTIVE_SELECTOR =
  "button, a, input, select, textarea, [role='button'], [role='link'], [tabindex]";
const RAGE_CLICK_IGNORE_SELECTOR = "[data-feedback-ignore-rage]";
const MAX_ACCESSIBLE_NAME_LENGTH = 120;
const GENERATED_CLASS_PATTERN = /\d{4,}|^[a-f0-9]{8,}$/i;
const CSS_IN_JS_CLASS_PATTERN = /^css-|^sc-/i;

function getInteractionTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest(INTERACTIVE_SELECTOR) ?? target;
}

function getStableClasses(element: Element | null): string {
  if (!element) {
    return "";
  }

  return Array.from(element.classList)
    .filter((name) =>
      !GENERATED_CLASS_PATTERN.test(name) && !CSS_IN_JS_CLASS_PATTERN.test(name),
    )
    .sort()
    .join(".");
}

function getAccessibleName(target: Element): string | null {
  const accessibleName = target.getAttribute("aria-label") ?? target.getAttribute("title");
  return accessibleName?.slice(0, MAX_ACCESSIBLE_NAME_LENGTH) ?? null;
}

function getTargetFingerprint(target: Element): string | null {
  const parent = target.parentElement;
  const accessibleName = getAccessibleName(target);
  const targetClasses = getStableClasses(target);
  const parentClasses = getStableClasses(parent);
  const identifyingParts = [
    target.getAttribute("type") ?? "",
    target.getAttribute("role") ?? "",
    accessibleName ?? "",
    targetClasses,
    parentClasses,
  ];

  if (!identifyingParts.some(Boolean)) {
    return null;
  }

  return [
    target.tagName.toLowerCase(),
    target.getAttribute("type") ?? "",
    target.getAttribute("role") ?? "",
    accessibleName ?? "",
    targetClasses,
    parent?.tagName.toLowerCase() ?? "",
    parentClasses,
  ].join(":");
}

function getClickPayload(event: MouseEvent): ClickPayload | null {
  const target = getInteractionTarget(event.target);
  if (!target) {
    return null;
  }

  return {
    id: target.id || null,
    className: target.getAttribute("class"),
    tagName: target.tagName,
    x: event.pageX,
    y: event.pageY,
    targetId: target.getAttribute("data-feedback-id"),
    role: target.getAttribute("role"),
    accessibleName: getAccessibleName(target),
    ignoredForRage: target.closest(RAGE_CLICK_IGNORE_SELECTOR) !== null,
    isTrusted: event.isTrusted,
    fingerprint: getTargetFingerprint(target),
  };
}

export const clicks = (eventQueue: EventQueue, sessionManager: SessionManager): void => {
  document.addEventListener("click", (event) => {
    const payload = getClickPayload(event);
    if (!payload) {
      return;
    }

    const feedbackEvent: Event = {
      id: crypto.randomUUID(),
      visitorId: getVisitorId(),
      sessionId: sessionManager.newActivity(),
      type: EventType.click,
      payload,
      createdAt: new Date(),
    };

    eventQueue.add(feedbackEvent);
  });
};
