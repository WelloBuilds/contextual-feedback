import { clickDetector } from "./detection/clickDetector.js";
function init(options) {
    console.log("SDK initialized");
    clickDetector();
}
export const Feedback = {
    init,
};
