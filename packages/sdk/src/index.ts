import { clickDetector } from "./detection/clickDetector.js";

export interface InitOptions {
  key: string;
}

function init(options: InitOptions): void {
  console.log("SDK initialized");
  clickDetector();
}

export const Feedback = {
  init,
};
