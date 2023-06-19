const assert = require("./assert.js");
require("./_utils.js");

const { fetch } = globalThis;

const tick = (ms = 10) => new Promise(($) => setTimeout($, ms));

const clear = (python) => {
    for (const [key, value] of Object.entries(python)) {
        if (typeof value === "object") python[key] = null;
        else python[key] = "";
    }
};

const patchFetch = (callback) => {
    Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        get() {
            try {
                return callback;
            } finally {
                globalThis.fetch = fetch;
            }
        },
    });
};

const { parseHTML } = require("linkedom");
const { document, window } = parseHTML("...");

globalThis.document = document;
globalThis.Element = window.Element;
globalThis.MutationObserver = window.MutationObserver;
globalThis.XPathResult = {};
globalThis.XPathEvaluator =
    window.XPathEvaluator ||
    class XPathEvaluator {
        createExpression() {
            return { evaluate: () => [] };
        }
    };

require("../cjs");

(async () => {
    // shared 3rd party mocks
    const {
        python: pyodide,
        setTarget,
        loadPyodide,
    } = await import("./mocked/pyodide.mjs");
    const { python: micropython } = await import("./mocked/micropython.mjs");

    // shared helpers
    const div = document.createElement("div");
    const shadowRoot = div.attachShadow({ mode: "open" });
    const content = `
    import sys
    import js
    js.document.currentScript.target.textContent = sys.version
  `;

    const { URL } = globalThis;
    globalThis.URL = function (href) {
        return { href };
    };
    globalThis.location = { href: "" };

    // all tests
    for (const test of [
        async function versionedRuntime() {
            document.head.innerHTML = `<script type="pyodide" version="0.23.2">${content}</script>`;
            await tick();
            assert(pyodide.content, content);
            assert(pyodide.target.tagName, "PYODIDE-SCRIPT");
        },

        async function basicExpectations() {
            document.head.innerHTML = `<script type="pyodide">${content}</script>`;
            await tick();
            assert(pyodide.content, content);
            assert(pyodide.target.tagName, "PYODIDE-SCRIPT");
        },

        async function foreignRuntime() {
            document.head.innerHTML = `<script type="pyodide" version="http://pyodide">${content}</script>`;
            await tick();
            assert(pyodide.content, content);
            assert(pyodide.target.tagName, "PYODIDE-SCRIPT");
        },

        async function basicMicroPython() {
            document.head.innerHTML = `<script type="micropython">${content}</script>`;
            await tick();
            assert(micropython.content, content);
            assert(micropython.target.tagName, "MICROPYTHON-SCRIPT");
            const script = document.head.firstElementChild;
            document.body.appendChild(script);
            await tick();
            assert(script.nextSibling, micropython.target);
            micropython.target = null;
        },

        async function exernalResourceInShadowRoot() {
            patchFetch(() =>
                Promise.resolve({ text: () => Promise.resolve("OK") }),
            );
            shadowRoot.innerHTML = `
        <my-plugin></my-plugin>
        <script src="./whatever" env="unique" type="pyodide" target="my-plugin"></script>
      `.trim();
            await tick();
            assert(pyodide.content, "OK");
            assert(pyodide.target.tagName, "MY-PLUGIN");
        },

        async function explicitTargetNode() {
            setTarget(div);
            shadowRoot.innerHTML = `
        <my-plugin></my-plugin>
        <script type="pyodide"></script>
      `.trim();
            await tick();
            assert(pyodide.target, div);
        },

        async function explicitTargetAsString() {
            setTarget("my-plugin");
            shadowRoot.innerHTML = `
        <my-plugin></my-plugin>
        <script type="pyodide"></script>
      `.trim();
            await tick();
            assert(pyodide.target.tagName, "MY-PLUGIN");
        },

        async function jsonConfig() {
            const packages = {};
            patchFetch(() => Promise.resolve({ json: () => ({ packages }) }));
            shadowRoot.innerHTML = `<script config="./whatever.json" type="pyodide"></script>`;
            await tick();
            assert(pyodide.packages, packages);
        },

        async function tomlConfig() {
            const jsonPackages = JSON.stringify({
                packages: { a: Math.random() },
            });
            patchFetch(() =>
                Promise.resolve({ text: () => Promise.resolve(jsonPackages) }),
            );
            shadowRoot.innerHTML = `<script config="./whatever.toml" type="pyodide"></script>`;
            // there are more promises in here let's increase the tick delay to avoid flaky tests
            await tick(20);
            assert(
                JSON.stringify({ packages: pyodide.packages }),
                jsonPackages,
            );
        },

        async function fetchConfig() {
            const jsonPackages = JSON.stringify({
                fetch: [
                    { files: ["./a.py", "./b.py"] },
                    { from: "utils" },
                    { from: "/utils", files: ["c.py"] },
                ],
            });
            patchFetch(() =>
                Promise.resolve({
                    arrayBuffer: () => Promise.resolve([]),
                    text: () => Promise.resolve(jsonPackages),
                }),
            );
            shadowRoot.innerHTML = `
        <script type="pyodide" config="./fetch.toml">
          import js
          import a, b
          js.console.log(a.x)
          js.console.log(b.x)
        </script>
      `;
            await tick(10);
        },

        async function testDefaultRuntime() {
            const pyodide = await pyscript.env.pyodide;
            const keys = Object.keys(loadPyodide()).join(",");
            assert(Object.keys(pyodide).join(","), keys);

            const unique = await pyscript.env.unique;
            assert(Object.keys(unique).join(","), keys);
        },

        async function pyEvents() {
            shadowRoot.innerHTML = `
      <button py-click="test()">test</button>
      <button py-env="unique" py-click="test()">test</button>
      `;
            await tick(20);
        },
    ]) {
        await test();
        clear(pyodide);
        clear(micropython);
    }

    globalThis.URL = URL;
})();
