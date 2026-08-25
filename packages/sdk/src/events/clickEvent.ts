import { EventType } from "./eventTypes.js";

export type ClickEvent = {
  target: string | null;
  x: number;
  y: number;
};
