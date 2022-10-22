import {
    addToScriptsQueue,
} from '../stores';

import { htmlDecode, ensureUniqueId } from '../utils';
import type { Runtime } from '../runtime';
import { getLogger } from '../logger';
import { pyExec } from '../pyexec';

const logger = getLogger('py-script');

export class PyScript extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    code: string;
    source: string;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.wrapper = document.createElement('slot');
        this.shadow.appendChild(this.wrapper);
    }

    connectedCallback() {
        ensureUniqueId(this);
        this.code = htmlDecode(this.innerHTML);
        this.innerHTML = '';

        addToScriptsQueue(this);

        if (this.hasAttribute('src')) {
            this.source = this.getAttribute('src');
        }
    }

    getSourceFromElement(): string {
        return htmlDecode(this.code);
    }

    async getSourceFromFile(s: string): Promise<string> {
        const response = await fetch(s);
        this.code = await response.text();
        return this.code;
    }

    async evaluate(runtime: Runtime): Promise<void> {
        const pySourceCode = this.source ? await this.getSourceFromFile(this.source)
                                         : this.getSourceFromElement();

        await pyExec(runtime, pySourceCode, this);
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
        ["py-dragover", "dragover"],
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

/** Initialize all elements with py-* handlers attributes  */
export async function initHandlers(runtime: Runtime) {
    logger.debug('Initializing py-* event handlers...');
    for (const pyAttribute of pyAttributeToEvent.keys()) {
        await createElementsWithEventListeners(runtime, pyAttribute);
    }
}

/** Initializes an element with the given py-on* attribute and its handler */
async function createElementsWithEventListeners(runtime: Runtime, pyAttribute: string): Promise<void> {
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll(`[${pyAttribute}]`);
    for (const el of matches) {
        if (el.id.length === 0) {
            throw new TypeError(`<${el.tagName.toLowerCase()}> must have an id attribute, when using the ${pyAttribute} attribute`)
        }
        const handlerCode = el.getAttribute(pyAttribute);
        const event = pyAttributeToEvent.get(pyAttribute);

        if (pyAttribute === 'pys-onClick' || pyAttribute === 'pys-onKeyDown'){
            console.warn("Use of pys-onClick and pys-onKeyDown attributes is deprecated in favor of py-onClick() and py-onKeyDown(). pys-on* attributes will be deprecated in a future version of PyScript.")
            const source = `
            from pyodide.ffi import create_proxy
            Element("${el.id}").element.addEventListener("${event}",  create_proxy(${handlerCode}))
            `;
            await runtime.run(source);
        }
        else{
            el.addEventListener(event, () => {
                (async() => {await runtime.run(handlerCode)})();
            });
        }
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
export async function mountElements(runtime: Runtime) {
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll('[py-mount]');
    logger.info(`py-mount: found ${matches.length} elements`);

    let source = '';
    for (const el of matches) {
        const mountName = el.getAttribute('py-mount') || el.id.split('-').join('_');
        source += `\n${mountName} = Element("${el.id}")`;
    }
    await runtime.run(source);
}
