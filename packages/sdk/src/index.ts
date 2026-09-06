import { clicks} from "./detection/clicks.js";
import { pageViewDetector } from "./detection/pageView.js";
import { errors } from "./detection/errors.js";
import { formInput } from "./detection/formInput.js";
import { formSubmit } from "./detection/formSubmit.js";
import { EventQueue } from "./queue/eventQueue.js";
import { Transport } from "./transport/transport.js";
import { SessionManager } from "./session/sessionManager.js";

export interface InitOptions {
  key: string;
}

function init(options: InitOptions): void {
  console.log("SDK initialized");
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
