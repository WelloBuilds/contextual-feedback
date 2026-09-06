import { clicks} from "./detection/clicks.js";
import { pageViewDetector } from "./detection/pageView.js";
import { errors } from "./detection/errors.js";
import { formInput } from "./detection/formInput.js";
import { formSubmit } from "./detection/formSubmit.js";

export interface InitOptions {
  key: string;
}

function init(options: InitOptions): void {
  console.log("SDK initialized");

  clicks();
  pageViewDetector();
  errors();
  formInput();
  formSubmit();
}

export const Feedback = {
  init,
};
