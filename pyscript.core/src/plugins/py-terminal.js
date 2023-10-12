// PyScript py-terminal plugin
import { hooks } from "../core.js";

const XTERM = "5.3.0";
const XTERM_READLINE = "1.1.1";

const { assign } = Object;

// Avoid conflicts with py-terminal re-definition
if (!customElements.get("py-terminal")) {
    document.head.append(
        assign(document.createElement("link"), {
            rel: "stylesheet",
            href: `https://cdn.jsdelivr.net/npm/xterm@${XTERM}/css/xterm.min.css`,
        }),
    );

    const [{ Terminal }, { Readline }] = await Promise.all([
        import(
            /* webpackIgnore: true */ `https://cdn.jsdelivr.net/npm/xterm@${XTERM}/+esm`
        ),
        import(
            /* webpackIgnore: true */ `https://cdn.jsdelivr.net/npm/xterm-readline@${XTERM_READLINE}/+esm`
        ),
    ]);

    customElements.define(
        "py-terminal",
        class extends HTMLElement {
            #terminal;
            #readline;
            init(options) {
                this.#readline = new Readline();
                this.#terminal = new Terminal({
                    theme: {
                        background: "#191A19",
                        foreground: "#F5F2E7",
                    },
                    ...options,
                });
                this.#terminal.loadAddon(this.#readline);
                this.#terminal.open(this);
                this.#terminal.focus();
            }
            readline(prompt) {
                return this.#readline.read(prompt);
            }
            write(line) {
                this.#readline.write(line);
            }
        },
    );

    const codeBefore = `
        from pyscript import pyterminal as _pyterminal
        _pyterminal.init()
    `;

    const codeAfter = `
        from pyscript import pyterminal as _pyterminal

        # avoid bootstrapping interact() if no terminal exists
        if _pyterminal.PY_TERMINAL:
            import code as _code
            _code.interact()
    `;

    const main = ({ io }) => {
        const pt = document.querySelector("py-terminal");
        if (pt) {
            cleanUp(true);
            pt.init({
                disableStdin: true,
                cursorBlink: false,
                cursorStyle: "underline",
            });
            io.stdout = (value) => {
                pt.write(`${value}\n`);
            };
            io.stderr = (error) => {
                pt.write(`${error.message || error}\n`);
            };
        }
    };

    const thread = (_, xworker) => {
        const pt = document.querySelector("py-terminal");
        if (pt) {
            cleanUp(false);
            pt.init({
                disableStdin: false,
                cursorBlink: true,
                cursorStyle: "block",
            });
            xworker.sync.pyterminal_readline = pt.readline.bind(pt);
            xworker.sync.pyterminal_write = pt.write.bind(pt);
        }
    };

    // we currently support only one <py-terminal>
    const cleanUp = (fromMain) => {
        hooks.onInterpreterReady.delete(main);
        hooks.onWorkerReady.delete(thread);
        if (fromMain) {
            hooks.codeBeforeRunWorker.delete(codeBefore);
            hooks.codeAfterRunWorker.delete(codeBefore);
        }
    };

    hooks.onInterpreterReady.add(main);
    hooks.onWorkerReady.add(thread);
    hooks.codeBeforeRunWorker.add(codeBefore);
    hooks.codeAfterRunWorker.add(codeAfter);
}
