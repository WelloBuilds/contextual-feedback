import { clicks} from "./detection/clicks.js";
import { pageViewDetector } from "./detection/pageView.js";

export interface InitOptions {
  key: string;
}

function init(options: InitOptions): void {
  console.log("SDK initialized");

  clicks();
  pageViewDetector();
}

export const Feedback = {
  init,
};
