import { ErrorPayload } from "../events/errorPayload"
import { EventType } from "../events/eventTypes"
import { Event } from "../events/event"

export const errors = () => {
    window.addEventListener('error' , (e)=>{
        const errorPayload: ErrorPayload = {
            type: 'uncaughtException',
            message: e.message,
        }
        const feedbackEvent: Event = {
            id: crypto.randomUUID(),
            type: EventType.error,
            payload: errorPayload,
            createdAt: new Date()
        }
        console.log("error" , feedbackEvent)
    })
}