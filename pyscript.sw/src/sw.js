// NOTE: this file must be a single JS file so that we can distribute it
//       as standalone "one-shop" entry for the Service Worker, i.e.:
//       <script src="../pyscript.sw.js" handler="./file.py"></script>

// prevent global scope pollution with local references
// this callback works in both the main page and in the SW
(({ document, navigator: { serviceWorker } }) => {
    // here we are on the main page
    if (document) {
        const { href } = location;
        const { controller } = serviceWorker;

        const { currentScript } = document;
        const {
            src,
            attributes: { config, handler, scope },
        } = currentScript;

        // send files to fetch and handle to the Service Worker
        // after resolving the path through current page location
        // (not the service worker one as these likely have different relative folders)
        if (controller) {
            controller.postMessage({
                config: config?.value ? new URL(config.value, href).href : "",
                // handler is mandatory (or it means there's nothing to run as Python)
                handler: new URL(handler.value, href).href,
            });
        }

        // do reload automatically once everything has been bootstrapped
        serviceWorker.addEventListener("message", ({ data }) => {
            if (data === "reload") location.reload();
        });

        // register the Service Worker with an optional scope ...
        serviceWorker
            .register(src, { scope: scope?.value || "." })
            .then((registration) => {
                // ... once registered, let the SW automatically handle the page reload
                registration.addEventListener("updatefound", () =>
                    location.reload(),
                );
                if (registration.active && !controller) location.reload();
            });
    }
    // here we are on the Service Worker
    else {
        const indexURL = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full";

        // because of this issue https://github.com/w3c/ServiceWorker/issues/1356
        // the pyodide must be loaded sync ASAP or `importScripts` will fail
        importScripts(`${indexURL}/pyodide.js`);

        // ⚠️ WARNING: this will be inlined by rollup - can't be used AS IS
        const parse = async (text) => (await import('basic-toml')).parse(text);

        // this is still not blocking so no problems should happen ... we can bring anything
        // directly from the CDN at this point, as pyodide is flagged as secure script here
        const interpreter = loadPyodide({ indexURL });

        // skip waiting on installation and ensure activation
        // this will trigger the automatic reload on the main page
        // once the Service Worker is ready to operate
        addEventListener("install", () => skipWaiting());
        addEventListener("activate", (e) => e.waitUntil(clients.claim()));

        let // used to postMessage a reload when everything is ready
            clientId,
            // keeps the handler path known for future updates
            handlerPath,
            // let fetch operations through until there is a handler
            handleReady = false,
            // wait for the postMessage to communicate where is the python file
            // and where is the config, if any
            handleRequest = new Promise(resolve => {
                addEventListener(
                    "message",
                    async ({ data: { config, handler } }) => {
                        if (config) {
                            const pyodide = await interpreter;
                            const deps = [
                                fetch(config),
                                pyodide.loadPackage("micropip"),
                            ];

                            // assign the right body retriever accordingly
                            // with the config extension
                            deps[0] = config.endsWith(".json") ?
                                deps[0].then((b) => b.json()) :
                                deps[0].then((b) => b.text()).then(parse);

                            const [{ packages }] = await Promise.all(deps);
                            const micropip = await pyodide.pyimport("micropip");
                            await micropip.install(packages);
                        }
                        handlerPath = handler;
                        const result = await getHandler();
                        handleReady = true;
                        const client = await clients.get(clientId);
                        client.postMessage("reload");
                        resolve(result);
                    },
                    { once: true },
                );
            });

        // used to update the handler when '/pyscript.sw/update_handler'
        // path is reached and the service worker is already initialized
        const getHandler = () => new Promise(async (resolve, reject) => {
            const pyodide = await interpreter;
            const code = await fetch(handlerPath).then(b => b.text());
            const globals = pyodide.globals.get("dict")();
            await pyodide.runPythonAsync(code, { globals }).catch(reject);
            resolve(globals.get("handle_request"));
            globals.destroy();
        });

        addEventListener("fetch", (event) => {
            if (!clientId) clientId = event.clientId;
            if (!handleReady) return;
            // this switch is to allow possible future operations too
            switch (new URL(event.request.url).pathname) {
                // reserved: this is our namespace to operate internally
                case '/pyscript.sw/update_handler':
                    const newHandler = getHandler();
                    event.respondWith(newHandler.then(
                        () => {
                            // only if successful the handleRequest is re-assigned
                            handleRequest = newHandler;
                            return new Response('OK', {
                                headers: {'content-type': 'text/plain'},
                                status: 200
                            });
                        },
                        error => new Response(error.message, {
                            headers: {'content-type': 'text/plain'},
                            status: 500
                        })
                    ));
                    break;
                default:
                    event.respondWith(
                        handleRequest.then(async (handler) => {
                            const [text, status, headers] = await handler(
                                event.request,
                            );
                            return new Response(text, { headers, status });
                        }),
                    );
                    break;
            }
        });
    }
})(self);
