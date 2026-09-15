import { Event } from "../events/event.js";

export class Transport{
    public async send(events : Event[]){
        const res = await fetch('http://localhost:3002/ingestion/events',{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({events:events})
        })

        if (!res.ok) {
            throw new Error(`Failed to send events: ${res}}`);
        }

    }
}