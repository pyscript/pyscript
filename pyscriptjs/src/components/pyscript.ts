import { htmlDecode, ensureUniqueId, showWarning } from '../utils';
import type { Runtime } from '../runtime';
import { getLogger } from '../logger';
import { pyExec } from '../pyexec';
import { FetchError, _createAlertBanner } from '../exceptions';

const logger = getLogger('py-script');

export function make_PyScript(runtime: Runtime) {
    class PyScript extends HTMLElement {
        async connectedCallback() {
            if (this.hasAttribute('output')) {
                const deprecationMessage = (
                    "The 'output' attribute is deprecated. You should use the " +
                    "'display' API to output the content to a specific element. " +
                    'For example display(myElement, target="divID").'
                )
                showWarning(deprecationMessage)
            }
            ensureUniqueId(this);
            const pySrc = await this.getPySrc();
            this.innerHTML = '';
            pyExec(runtime, pySrc, this);
        }

        async getPySrc(): Promise<string> {
            if (this.hasAttribute('src')) {
                const url = this.getAttribute('src');
                const response = await fetch(url);
                if (response.status !== 200) {
                    const errorMessage = (
                        `Failed to fetch '${url}' - Reason: ` +
                        `${response.status} ${response.statusText}`
                    );
                    _createAlertBanner(errorMessage);
                    this.innerHTML = '';
                    throw new FetchError(errorMessage);
                }
                return await response.text();
            } else {
                return htmlDecode(this.innerHTML);
            }
        }
    }

    return PyScript;
}

/** Defines all possible py-on* and their corresponding event types  */
const pyAttributeToEvent: Map<string, string> = new Map<string, string>([
    // Leaving pys-onClick and pys-onKeyDown for backward compatibility
    ['pys-onClick', 'click'],
    ['pys-onKeyDown', 'keydown'],
    ['py-onClick', 'click'],
    ['py-onKeyDown', 'keydown'],
    // Window Events
    ['py-afterprint', 'afterprint'],
    ['py-beforeprint', 'beforeprint'],
    ['py-beforeunload', 'beforeunload'],
    ['py-error', 'error'],
    ['py-hashchange', 'hashchange'],
    ['py-load', 'load'],
    ['py-message', 'message'],
    ['py-offline', 'offline'],
    ['py-online', 'online'],
    ['py-pagehide', 'pagehide'],
    ['py-pageshow', 'pageshow'],
    ['py-popstate', 'popstate'],
    ['py-resize', 'resize'],
    ['py-storage', 'storage'],
    ['py-unload', 'unload'],

    // Form Events
    ['py-blur', 'blur'],
    ['py-change', 'change'],
    ['py-contextmenu', 'contextmenu'],
    ['py-focus', 'focus'],
    ['py-input', 'input'],
    ['py-invalid', 'invalid'],
    ['py-reset', 'reset'],
    ['py-search', 'search'],
    ['py-select', 'select'],
    ['py-submit', 'submit'],

    // Keyboard Events
    ['py-keydown', 'keydown'],
    ['py-keypress', 'keypress'],
    ['py-keyup', 'keyup'],

    // Mouse Events
    ['py-click', 'click'],
    ['py-dblclick', 'dblclick'],
    ['py-mousedown', 'mousedown'],
    ['py-mousemove', 'mousemove'],
    ['py-mouseout', 'mouseout'],
    ['py-mouseover', 'mouseover'],
    ['py-mouseup', 'mouseup'],
    ['py-mousewheel', 'mousewheel'],
    ['py-wheel', 'wheel'],

    // Drag Events
    ['py-drag', 'drag'],
    ['py-dragend', 'dragend'],
    ['py-dragenter', 'dragenter'],
    ['py-dragleave', 'dragleave'],
    ['py-dragover', 'dragover'],
    ['py-dragstart', 'dragstart'],
    ['py-drop', 'drop'],
    ['py-scroll', 'scroll'],

    // Clipboard Events
    ['py-copy', 'copy'],
    ['py-cut', 'cut'],
    ['py-paste', 'paste'],

    // Media Events
    ['py-abort', 'abort'],
    ['py-canplay', 'canplay'],
    ['py-canplaythrough', 'canplaythrough'],
    ['py-cuechange', 'cuechange'],
    ['py-durationchange', 'durationchange'],
    ['py-emptied', 'emptied'],
    ['py-ended', 'ended'],
    ['py-loadeddata', 'loadeddata'],
    ['py-loadedmetadata', 'loadedmetadata'],
    ['py-loadstart', 'loadstart'],
    ['py-pause', 'pause'],
    ['py-play', 'play'],
    ['py-playing', 'playing'],
    ['py-progress', 'progress'],
    ['py-ratechange', 'ratechange'],
    ['py-seeked', 'seeked'],
    ['py-seeking', 'seeking'],
    ['py-stalled', 'stalled'],
    ['py-suspend', 'suspend'],
    ['py-timeupdate', 'timeupdate'],
    ['py-volumechange', 'volumechange'],
    ['py-waiting', 'waiting'],

    // Misc Events
    ['py-toggle', 'toggle'],
]);

/** Initialize all elements with py-* handlers attributes  */
export function initHandlers(runtime: Runtime) {
    logger.debug('Initializing py-* event handlers...');
    for (const pyAttribute of pyAttributeToEvent.keys()) {
        createElementsWithEventListeners(runtime, pyAttribute);
    }
}

/** Initializes an element with the given py-on* attribute and its handler */
function createElementsWithEventListeners(runtime: Runtime, pyAttribute: string) {
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll(`[${pyAttribute}]`);
    for (const el of matches) {
        if (el.id.length === 0) {
            throw new TypeError(
                `<${el.tagName.toLowerCase()}> must have an id attribute, when using the ${pyAttribute} attribute`,
            );
        }
        const handlerCode = el.getAttribute(pyAttribute);
        const event = pyAttributeToEvent.get(pyAttribute);

        if (pyAttribute === 'pys-onClick' || pyAttribute === 'pys-onKeyDown') {
            console.warn(
                'Use of pys-onClick and pys-onKeyDown attributes is deprecated in favor of py-onClick() and py-onKeyDown(). pys-on* attributes will be deprecated in a future version of PyScript.',
            );
            const source = `
            from pyodide.ffi import create_proxy
            Element("${el.id}").element.addEventListener("${event}",  create_proxy(${handlerCode}))
            `;
            runtime.run(source);
        } else {
            el.addEventListener(event, () => {
                runtime.run(handlerCode);
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
export function mountElements(runtime: Runtime) {
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll('[py-mount]');
    logger.info(`py-mount: found ${matches.length} elements`);

    let source = '';
    for (const el of matches) {
        const mountName = el.getAttribute('py-mount') || el.id.split('-').join('_');
        source += `\n${mountName} = Element("${el.id}")`;
    }
    runtime.run(source);
}
