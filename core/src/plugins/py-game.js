import { dedent, define } from "polyscript/exports";

import { stdlib } from "../core.js";
import { configDetails } from "../config.js";
import { getText } from "../fetch.js";

let toBeWarned = true;

const hooks = {
    main: {
        onReady: async (wrap, script) => {
            if (toBeWarned) {
                toBeWarned = false;
                console.warn("⚠️ EXPERIMENTAL `py-game` FEATURE");
            }
            if (script.hasAttribute("config")) {
                const value = script.getAttribute("config");
                const { json, toml, text } = configDetails(value);
                let config = {};
                if (json) config = JSON.parse(text);
                else if (toml) {
                    const { parse } = await import(
                        /* webpackIgnore: true */ "../3rd-party/toml.js"
                    );
                    config = parse(text);
                }
                if (config.packages) {
                    const micropip = wrap.interpreter.pyimport("micropip");
                    await micropip.install(config.packages, {
                        keep_going: true,
                    });
                    micropip.destroy();
                }
            }

            wrap.interpreter.registerJsModule("_pyscript", {
                PyWorker() {
                    throw new Error(
                        "Unable to use PyWorker in py-game scripts",
                    );
                },
                js_import: (...urls) =>
                    Promise.all(urls.map((url) => import(url))),
                get target() {
                    return script.id;
                },
            });

            await wrap.interpreter.runPythonAsync(stdlib);

            let code = dedent(script.textContent);
            if (script.src) code = await fetch(script.src).then(getText);

            const target = script.getAttribute("target") || "canvas";
            const canvas = document.getElementById(target);
            wrap.interpreter.canvas.setCanvas2D(canvas);
            await wrap.interpreter.runPythonAsync(code);
        },
    },
};

define("py-game", {
    config: { packages: ["pygame-ce"] },
    configURL: new URL("./config.txt", location.href).href,
    interpreter: "pyodide",
    env: "py-game",
    hooks,
});
