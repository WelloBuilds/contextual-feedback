import { clicks } from "./detection/clicks.js";
import { pageViewDetector } from "./detection/pageView.js";
import { errors } from "./detection/errors.js";
import { formInput } from "./detection/formInput.js";
import { formSubmit } from "./detection/formSubmit.js";
import { EventQueue } from "./queue/eventQueue.js";
import { Transport, setConfig } from "./transport/transport.js";
import { SessionManager } from "./session/sessionManager.js";

export type InitOptions = {
  workspaceId: string;
};

export type FeedbackConfig = InitOptions;

let config: FeedbackConfig | null = null;

function init(options: FeedbackConfig): void {
  console.log("SDK initialized");
  config = options;
  setConfig(options);

  const transport = new Transport();
  const eventQueue = new EventQueue(transport);
  const sessionManager = new SessionManager();

  clicks(eventQueue, sessionManager);
  pageViewDetector(eventQueue, sessionManager);
  errors(eventQueue, sessionManager);
  formInput(eventQueue, sessionManager);
  formSubmit(eventQueue, sessionManager);
}

export const Feedback = {
  init,
};

export { config };