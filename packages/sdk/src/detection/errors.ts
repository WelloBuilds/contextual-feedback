import { ErrorPayload } from "../events/errorPayload"
import { EventType } from "../events/eventTypes"
import { Event } from "../events/event"
import { EventQueue } from "../queue/eventQueue.js";
import { SessionManager } from "../session/sessionManager";

export const errors = (eventQueue : EventQueue, sessionManager: SessionManager) => {
    const sessionId = sessionManager.newActivity();

    window.addEventListener('error' , (e)=>{
        const errorPayload: ErrorPayload = {
            type: 'uncaughtException',
            message: e.message,
        }
        const feedbackEvent: Event = {
            id: crypto.randomUUID(),
            sessionId: sessionId,
            type: EventType.error,
            payload: errorPayload,
            createdAt: new Date()
        }
        eventQueue.add(feedbackEvent)
    })
    window.addEventListener('unhandledrejection' , (e)=>{

        const reason = e.reason;
        const message = reason instanceof Error 
            ? reason.message
            : typeof reason === "string"
              ? reason
              : "Unhandled rejection";

        const errorPayload: ErrorPayload = {
            type: 'unhandledRejection',
            message: message,
        }
        const feedbackEvent: Event = {
            id: crypto.randomUUID(),
            sessionId: sessionId,
            type: EventType.error,
            payload: errorPayload,
            createdAt: new Date()
        }
        eventQueue.add(feedbackEvent)
        sessionManager.newActivity()
    })
}