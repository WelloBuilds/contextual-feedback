import { Event } from "../events/event.js";

export class Transport{
    public send(events : Event[]){
        console.log("Sending Batch", events)
    }
}