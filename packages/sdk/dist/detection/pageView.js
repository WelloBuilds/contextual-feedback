export const pageViewDetector = () => {
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
        console.log("push state:", window.location.href);
        originalPushState.apply(this, args);
    };
    window.addEventListener("popstate", (e) => {
        console.log("pop state:", e);
    });
};
