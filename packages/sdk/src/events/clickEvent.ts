import { EventType } from "./eventTypes.js";

export type ClickEvent = {
  id: string | null;
  className : string | null;
  tagName : string | null;
  x: number;
  y: number;
};
