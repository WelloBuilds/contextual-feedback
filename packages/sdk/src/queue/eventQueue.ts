import { Event } from "../events/event.js";
import { Transport } from "../transport/transport.js";

export class EventQueue {
    private events: Event[] =[] ;
    private flushTimer: number | null = null 

    constructor(private transport:Transport){}

    public add ( event: Event ){
        this.events.push(event);

        if (this.events.length >= 15) {
            this.flush();
            return;
          }
        
          if (this.flushTimer === null) {
            this.startTimer();
          }
    }

    private startTimer(){
        this.flushTimer = setTimeout(() => {
            this.flush();
        }, 30_000);
    }

    private flush(){
        this.transport.send(this.events);
        this.events = []; 
        this.clearTimer();
    }

    private clearTimer(){
        if (this.flushTimer !== null) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
    }

}