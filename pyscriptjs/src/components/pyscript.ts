import {
    addInitializer,
    addPostInitializer,
    addToScriptsQueue,
    loadedEnvironments,
    mode,
    pyodideLoaded,
    type Environment,
} from '../stores';
import { addClasses, htmlDecode } from '../utils';
import { BaseEvalElement } from './base';
import type { PyodideInterface } from '../pyodide';

// Premise used to connect to the first available pyodide interpreter
let pyodideReadyPromise;
let environments: Record<Environment['id'], Environment> = {};
let currentMode;

pyodideLoaded.subscribe(value => {
    pyodideReadyPromise = value;
});
loadedEnvironments.subscribe(value => {
    environments = value;
});

mode.subscribe(value => {
    currentMode = value;
});

export class PyScript extends BaseEvalElement {
    constructor() {
        super();

        // add an extra div where we can attach the codemirror editor
        this.shadow.appendChild(this.wrapper);
    }

    connectedCallback() {
        this.checkId();
        this.code = htmlDecode(this.innerHTML);
        this.innerHTML = '';

        const mainDiv = document.createElement('div');
        addClasses(mainDiv, ['output']);
        // add Editor to main PyScript div

        if (this.hasAttribute('output')) {
            this.errorElement = this.outputElement = document.getElementById(this.getAttribute('output'));

            // in this case, the default output-mode is append, if hasn't been specified
            if (!this.hasAttribute('output-mode')) {
                this.setAttribute('output-mode', 'append');
            }
        } else {
            if (this.hasAttribute('std-out')) {
                this.outputElement = document.getElementById(this.getAttribute('std-out'));
            } else {
                // In this case neither output or std-out have been provided so we need
                // to create a new output div to output to

                // Let's check if we have an id first and create one if not
                this.outputElement = document.createElement('div');
                const exec_id = this.getAttribute('exec-id');
                this.outputElement.id = this.id + (exec_id ? '-' + exec_id : '');

                // add the output div id if there's not output pre-defined
                mainDiv.appendChild(this.outputElement);
            }

            if (this.hasAttribute('std-err')) {
                this.errorElement = document.getElementById(this.getAttribute('std-err'));
            } else {
                this.errorElement = this.outputElement;
            }
        }

        if (currentMode == 'edit') {
            // TODO: We need to build a plan for this
            this.appendChild(mainDiv);
        } else {
            this.appendChild(mainDiv);
            addToScriptsQueue(this);
        }

        console.log('connected');

        if (this.hasAttribute('src')) {
            this.source = this.getAttribute('src');
        }
    }

    protected async _register_esm(pyodide: PyodideInterface): Promise<void> {
        for (const node of document.querySelectorAll("script[type='importmap']")) {
            const importmap = (() => {
                try {
                    return JSON.parse(node.textContent);
                } catch {
                    return null;
                }
            })();

            if (importmap?.imports == null) continue;

            for (const [name, url] of Object.entries(importmap.imports)) {
                if (typeof name != 'string' || typeof url != 'string') continue;

                let exports: object;
                try {
                    // XXX: pyodide doesn't like Module(), failing with
                    // "can't read 'name' of undefined" at import time
                    exports = { ...(await import(url)) };
                } catch {
                    console.warn(`failed to fetch '${url}' for '${name}'`);
                    continue;
                }

                pyodide.registerJsModule(name, exports);
            }
        }
    }

    getSourceFromElement(): string {
        return htmlDecode(this.code);
    }
}

/** Defines all possible py-on* and their corresponding event types  */
const pyAttributeToEvent: Map<string, string> = new Map<string, string>([
        // Leaving pys-onClick and pys-onKeyDown for backward compatibility
        ["pys-onClick", "click"],
        ["pys-onKeyDown", "keydown"],
        ["py-onClick", "click"],
        ["py-onKeyDown", "keydown"],
        // Window Events
        ["py-afterprint", "afterprint"],
        ["py-beforeprint", "beforeprint"],
        ["py-beforeunload", "beforeunload"],
        ["py-error", "error"],
        ["py-hashchange", "hashchange"],
        ["py-load", "load"],
        ["py-message", "message"],
        ["py-offline", "offline"],
        ["py-online", "online"],
        ["py-pagehide", "pagehide"],
        ["py-pageshow", "pageshow"],
        ["py-popstate", "popstate"],
        ["py-resize", "resize"],
        ["py-storage", "storage"],
        ["py-unload", "unload"],

        // Form Events
        ["py-blur", "blur"],
        ["py-change", "change"],
        ["py-contextmenu", "contextmenu"],
        ["py-focus", "focus"],
        ["py-input", "input"],
        ["py-invalid", "invalid"],
        ["py-reset", "reset"],
        ["py-search", "search"],
        ["py-select", "select"],
        ["py-submit", "submit"],

        // Keyboard Events
        ["py-keydown", "keydown"],
        ["py-keypress", "keypress"],
        ["py-keyup", "keyup"],

        // Mouse Events
        ["py-click", "click"],
        ["py-dblclick", "dblclick"],
        ["py-mousedown", "mousedown"],
        ["py-mousemove", "mousemove"],
        ["py-mouseout", "mouseout"],
        ["py-mouseover", "mouseover"],
        ["py-mouseup", "mouseup"],
        ["py-mousewheel", "mousewheel"],
        ["py-wheel", "wheel"],

        // Drag Events
        ["py-drag", "drag"],
        ["py-dragend", "dragend"],
        ["py-dragenter", "dragenter"],
        ["py-dragleave", "dragleave"],
        ["pyon-dragover", "dragover"],
        ["py-dragstart", "dragstart"],
        ["py-drop", "drop"],
        ["py-scroll", "scroll"],

        // Clipboard Events
        ["py-copy", "copy"],
        ["py-cut", "cut"],
        ["py-paste", "paste"],

        // Media Events
        ["py-abort", "abort"],
        ["py-canplay", "canplay"],
        ["py-canplaythrough", "canplaythrough"],
        ["py-cuechange", "cuechange"],
        ["py-durationchange", "durationchange"],
        ["py-emptied", "emptied"],
        ["py-ended", "ended"],
        ["py-loadeddata", "loadeddata"],
        ["py-loadedmetadata", "loadedmetadata"],
        ["py-loadstart", "loadstart"],
        ["py-pause", "pause"],
        ["py-play", "play"],
        ["py-playing", "playing"],
        ["py-progress", "progress"],
        ["py-ratechange", "ratechange"],
        ["py-seeked", "seeked"],
        ["py-seeking", "seeking"],
        ["py-stalled", "stalled"],
        ["py-suspend", "suspend"],
        ["py-timeupdate", "timeupdate"],
        ["py-volumechange", "volumechange"],
        ["py-waiting", "waiting"],

        // Misc Events
        ["py-toggle", "toggle"],
        ]);

/** Initialize all elements with py-on* handlers attributes  */
async function initHandlers() {
    console.log('Collecting nodes...');
    const pyodide = await pyodideReadyPromise;
    for (const pyAttribute of pyAttributeToEvent.keys()) {
        await createElementsWithEventListeners(pyodide, pyAttribute);
    }
}

/** Initializes an element with the given py-on* attribute and its handler */
async function createElementsWithEventListeners(pyodide: PyodideInterface, pyAttribute: string): Promise<void> {
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll(`[${pyAttribute}]`);
    for (const el of matches) {
        if (el.id.length === 0) {
            throw new TypeError(`<${el.tagName.toLowerCase()}> must have an id attribute, when using the ${pyAttribute} attribute`)
        }
        const handlerCode = el.getAttribute(pyAttribute);
        const event = pyAttributeToEvent.get(pyAttribute);
        const source = `
        from pyodide import create_proxy
        Element("${el.id}").element.addEventListener("${event}",  create_proxy(${handlerCode}))
        `;
        await pyodide.runPythonAsync(source);

        // TODO: Should we actually map handlers in JS instead of Python?
        // el.onclick = (evt: any) => {
        //   console.log("click");
        //   new Promise((resolve, reject) => {
        //     setTimeout(() => {
        //       console.log('Inside')
        //     }, 300);
        //   }).then(() => {
        //     console.log("resolved")
        //   });
        //   // let handlerCode = el.getAttribute('py-onClick');
        //   // pyodide.runPython(handlerCode);
        // }
    }

}

/** Mount all elements with attribute py-mount into the Python namespace */
async function mountElements() {
    console.log('Collecting nodes to be mounted into python namespace...');
    const pyodide = await pyodideReadyPromise;
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll('[py-mount]');

    let source = '';
    for (const el of matches) {
        const mountName = el.getAttribute('py-mount') || el.id.split('-').join('_');
        source += `\n${mountName} = Element("${el.id}")`;
    }
    await pyodide.runPythonAsync(source);
}
addInitializer(mountElements);
addPostInitializer(initHandlers);
