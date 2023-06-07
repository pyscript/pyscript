import coincident from "coincident/structured";
import xworker from "./xworker.js";
import { assign, defineProperties, absoluteURL } from "../utils.js";
import { getText } from "../fetch-utils.js";

/**
 * @typedef {Object} WorkerOptions plugin configuration
 * @prop {string} type the runtime/interpreter type to use
 * @prop {string} [version] the optional runtime version to use
 * @prop {string} [config] the optional config to use within such runtime
 */

export default (...args) =>
    /**
     * A XWorker is a Worker facade able to bootstrap a channel with any desired runtime.
     * @param {string} url the remote file to evaluate on bootstrap
     * @param {WorkerOptions} [options] optional arguments to define the runtime to use
     * @returns {Worker}
     */
    function XWorker(url, options) {
        const worker = xworker();
        const { postMessage } = worker;
        if (args.length) {
            const [type, version] = args;
            options = assign({}, options || { type, version });
            if (!options.type) options.type = type;
        }
        if (options?.config) options.config = absoluteURL(options.config);
        const bootstrap = fetch(url)
            .then(getText)
            .then((code) => postMessage.call(worker, { options, code }));
        return defineProperties(worker, {
            postMessage: {
                value: (data, ...rest) =>
                    bootstrap.then(() =>
                        postMessage.call(worker, data, ...rest),
                    ),
            },
            sync: {
                value: coincident(worker),
            },
        });
    };
