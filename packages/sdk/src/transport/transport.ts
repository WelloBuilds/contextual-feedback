import { Event } from "../events/event.js";
import type { InitOptions } from "../index.js";

let config: InitOptions | null = null;

export function setConfig(options: InitOptions): void {
  config = options;
}

export class Transport {
  public async send(events: Event[]) {
    const res = await fetch("http://localhost:3002/ingestion/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Workspace-Id": config?.workspaceId ?? "",
      },
      body: JSON.stringify({ events: events }),
    });

    if (!res.ok) {
      throw new Error(`Failed to send events: ${res}`);
    }
  }
}