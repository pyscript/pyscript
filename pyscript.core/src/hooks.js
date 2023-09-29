import { typedSet } from "type-checked-collections";

const SetFunction = typedSet({ typeof: "function" });
const SetString = typedSet({ typeof: "string" });

export default {
    /** @type {Set<function>} */
    onInterpreterReady: new SetFunction(),
    /** @type {Set<function>} */
    onBeforeRun: new SetFunction(),
    /** @type {Set<function>} */
    onBeforeRunAsync: new SetFunction(),
    /** @type {Set<function>} */
    onAfterRun: new SetFunction(),
    /** @type {Set<function>} */
    onAfterRunAsync: new SetFunction(),

    /** @type {Set<function>} */
    onWorkerReady: new SetFunction(),
    /** @type {Set<string>} */
    codeBeforeRunWorker: new SetString(),
    /** @type {Set<string>} */
    codeBeforeRunWorkerAsync: new SetString(),
    /** @type {Set<string>} */
    codeAfterRunWorker: new SetString(),
    /** @type {Set<string>} */
    codeAfterRunWorkerAsync: new SetString(),
};
