// PyScript py-editor plugin
import { notify } from "./error.js";


const SELECTOR = 'script[type="py-editor"]';


// show the error on main and
// stops the module from keep executing
const notifyAndThrow = (message) => {
    notify(message);
    throw new Error(message);
};

const pyEditor = async () => {
    const editors = document.querySelectorAll(SELECTOR);

    // no results will look further for runtime nodes
    if (!editors.length) return;

    // if we arrived this far, let's drop the MutationObserver
    // as we only support one terminal per page (right now).
    mo.disconnect();

    const [element] = editors;
    // hopefully to be removed in the near future!
    if (element.matches('script[type="mpy"],mpy-script'))
        notifyAndThrow("Unsupported terminal.");

    // import styles lazily
    // TODO: Replace all CSS below
    document.head.append(
        Object.assign(document.createElement("link"), {
            rel: "stylesheet",
            href: new URL("./xterm.css", import.meta.url),
        }),
    );

    // lazy load these only when a valid terminal is found
    // TODO: Replace all JS below
    await Promise.all([
        import(/* webpackIgnore: true */ "../3rd-party/xterm.js"),
        import(/* webpackIgnore: true */ "../3rd-party/xterm-readline.js"),
    ]);


    // common main thread initialization for both worker
    // or main case, bootstrapping the terminal on its target
    const init = () => {
        
        let target = element;
        const selector = element.getAttribute("target");
        if (selector) {
            target =
                document.getElementById(selector) ||
                document.querySelector(selector);
            if (!target) throw new Error(`Unknown target ${selector}`);
        } else {
            target = document.createElement("py-editor");
            target.style.display = "block";
            element.after(target);
        }
        
    };
    init();
   
};

const mo = new MutationObserver(pyEditor);
mo.observe(document, { childList: true, subtree: true });

// try to check the current document ASAP
export default pyEditor();
