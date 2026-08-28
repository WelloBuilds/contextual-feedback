import { clickDetector } from "./detection/clickDetector.js";
import { pageViewDetector } from "./detection/pageView.js";
function init(options) {
    console.log("SDK initialized");
    clickDetector();
    pageViewDetector();
}
export const Feedback = {
    init,
};
