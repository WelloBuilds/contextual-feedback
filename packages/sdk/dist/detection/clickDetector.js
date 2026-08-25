import { EventType } from "../events/eventTypes";
export const clickDetector = () => {
    document.addEventListener("click", (e) => {
        const clickEvent = {
            target: e.target instanceof HTMLElement && e.target.id ? e.target.id : null,
            x: e.pageX,
            y: e.pageY,
        };
        const feedbackEvent = {
            id: crypto.randomUUID(),
            type: EventType.click,
            payload: clickEvent,
            createdAt: new Date(),
        };
        console.log(feedbackEvent);
    });
};
