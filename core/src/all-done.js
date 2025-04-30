import withResolvers from "@webreflection/utils/with-resolvers";
import TYPES from "./types.js";

const waitForIt = [];

for (const [TYPE] of TYPES) {
    const selectors = [`script[type="${TYPE}"]`, `${TYPE}-script`];
    for (const element of document.querySelectorAll(selectors.join(","))) {
        const { promise, resolve } = withResolvers();
        waitForIt.push(promise);
        element.addEventListener(`${TYPE}:done`, resolve, { once: true });
    }
}

// wait for all the things then cleanup
Promise.all(waitForIt).then(() => {
    dispatchEvent(new Event("py:all-done"));
});
