import { EventType } from "../events/eventTypes.js";
export const clickDetector = () => {
    document.addEventListener("click", (e) => {
        const target = e.target;
        const targetId = e.target instanceof HTMLElement && e.target.id ? e.target.id : null;
        const clickPayload = {
            target: targetId,
            x: e.pageX,
            y: e.pageY,
        };
        const feedbackEvent = {
            id: crypto.randomUUID(),
            type: EventType.click,
            payload: clickPayload,
            createdAt: new Date(),
        };
        console.log(feedbackEvent);
    });
};
