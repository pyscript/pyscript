import { htmlDecode, ensureUniqueId, createDeprecationWarning } from '../utils';
import { getLogger } from '../logger';
import { pyExec, displayPyException } from '../pyexec';
import { _createAlertBanner } from '../exceptions';
import { robustFetch } from '../fetch';
import { PyScriptApp } from '../main';
import { Stdio } from '../stdio';
import { InterpreterClient } from '../interpreter_client';

const logger = getLogger('py-script');

export function make_PyScript(interpreter: InterpreterClient, app: PyScriptApp) {
    class PyScript extends HTMLElement {
        srcCode: string;
        stdout_manager: Stdio | null;
        stderr_manager: Stdio | null;

        async connectedCallback() {
            /**
             * Since connectedCallback is async, multiple py-script tags can be executed in
             * an order which is not particularly sequential. The locking mechanism here ensures
             * a sequential execution of multiple py-script tags present in one page.
             *
             * Concurrent access to the multiple py-script tags is thus avoided.
             */
            app.incrementPendingTags();
            let releaseLock: () => void;
            try {
                releaseLock = await app.tagExecutionLock();
                ensureUniqueId(this);
                // Save innerHTML information in srcCode so we can access it later
                // once we clean innerHTML (which is required since we don't want
                // source code to be rendered on the screen)
                this.srcCode = this.innerHTML;
                const pySrc = await this.getPySrc();
                this.innerHTML = '';

                await app.plugins.beforePyScriptExec({ interpreter: interpreter, src: pySrc, pyScriptTag: this });
                const result = (await pyExec(interpreter, pySrc, this)).result;
                await app.plugins.afterPyScriptExec({
                    interpreter: interpreter,
                    src: pySrc,
                    pyScriptTag: this,
                    result: result,
                });
            } finally {
                releaseLock();
                app.decrementPendingTags();
            }
        }

        async getPySrc(): Promise<string> {
            if (this.hasAttribute('src')) {
                const url = this.getAttribute('src');
                try {
                    const response = await robustFetch(url);
                    return await response.text();
                } catch (err) {
                    const e = err as Error;
                    _createAlertBanner(e.message);
                    this.innerHTML = '';
                    throw e;
                }
            } else {
                return htmlDecode(this.srcCode);
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
export async function initHandlers(interpreter: InterpreterClient) {
    logger.debug('Initializing py-* event handlers...');
    for (const pyAttribute of pyAttributeToEvent.keys()) {
        await createElementsWithEventListeners(interpreter, pyAttribute);
    }
}

/** Initializes an element with the given py-on* attribute and its handler */
async function createElementsWithEventListeners(interpreter: InterpreterClient, pyAttribute: string) {
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll(`[${pyAttribute}]`);
    for (const el of matches) {
        // If the element doesn't have an id, let's add one automatically!
        if (el.id.length === 0) {
            ensureUniqueId(el);
        }
        const handlerCode = el.getAttribute(pyAttribute);
        const event = pyAttributeToEvent.get(pyAttribute);

        if (pyAttribute === 'pys-onClick' || pyAttribute === 'pys-onKeyDown') {
            const msg =
                `The attribute 'pys-onClick' and 'pys-onKeyDown' are deprecated. Please 'py-click="myFunction()"' ` +
                ` or 'py-keydown="myFunction()"' instead.`;
            createDeprecationWarning(msg, msg);
            const source = `
            from pyodide.ffi import create_proxy
            Element("${el.id}").element.addEventListener("${event}",  create_proxy(${handlerCode}))
            `;

            // We meed to run the source code in a try/catch block, because
            // the source code may contain a syntax error, which will cause
            // the splashscreen to not be removed.
            try {
                await interpreter.run(source);
            } catch (e) {
                logger.error((e as Error).message);
            }
        } else {
            el.addEventListener(event, () => {
                void (async () => {
                    try {
                        await interpreter.run(handlerCode);
                    } catch (e) {
                        const err = e as Error;
                        displayPyException(err, el.parentElement);
                    }
                })();
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
export async function mountElements(interpreter: InterpreterClient) {
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll('[py-mount]');
    logger.info(`py-mount: found ${matches.length} elements`);

    if (matches.length > 0) {
        //last non-deprecated version: 2023.03.1
        const deprecationMessage =
            'The "py-mount" attribute is deprecated. Please add references to HTML Elements manually in your script.';
        createDeprecationWarning(deprecationMessage, 'py-mount');
    }

    let source = '';
    for (const el of matches) {
        const mountName = el.getAttribute('py-mount') || el.id.split('-').join('_');
        source += `\n${mountName} = Element("${el.id}")`;
    }
    await interpreter.run(source);
}
