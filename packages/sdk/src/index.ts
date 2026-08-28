import { clickDetector } from "./detection/clickDetector.js";
import { pageViewDetector } from "./detection/pageView.js";

export interface InitOptions {
  key: string;
}

function init(options: InitOptions): void {
  console.log("SDK initialized");

  clickDetector();
  pageViewDetector();
}

export const Feedback = {
  init,
};
