import { htmlDecode, ensureUniqueId, createDeprecationWarning } from '../utils';
import type { Interpreter } from '../interpreter';
import { getLogger } from '../logger';
import { pyExec, displayPyException } from '../pyexec';
import { _createAlertBanner, UserError, ErrorCode } from '../exceptions';
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
const browserEvents: Array<string> = new Array<string>("click", "keydown",
    "afterprint", "beforeprint", "beforeunload", "error", "hashchange",
    "load", "message", "offline", "online", "pagehide", "pageshow", "popstate",
    "resize", "storage", "unload", "blur", "change", "contextmenu", "focus",
    "input", "invalid", "reset", "search", "select", "submit", "keydown",
    "keypress", "keyup", "dblclick", "mousedown", "mousemove", "mouseout",
    "mouseover", "mouseup", "mousewheel", "wheel", "drag", "dragend",
    "dragenter", "dragleave", "dragover", "dragstart", "drop", "scroll",
    "copy", "cut", "paste", "abort", "canplay", "canplaythrough", "cuechange",
    "durationchange", "emptied", "ended", "loadeddata", "loadedmetadata",
    "loadstart", "pause", "play", "playing", "progress", "ratechange",
    "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange",
    "waiting", "toggle");

/** Initialize all elements with py-* handlers attributes  */
export async function initHandlers(interpreter: InterpreterClient) {
    logger.debug('Initializing py-* event handlers...');
    for (const browserEvent of browserEvents) {
        createElementsWithEventListeners(interpreter, browserEvent);
    }
}

/** Initializes an element with the given py-on* attribute and its handler */
async function createElementsWithEventListeners(interpreter: InterpreterClient, pyAttribute: string) {
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll(`[${pyAttribute}]`);
    for (const el of matches) {
        // If the element doesn't have an id, let's add one automatically
        if (el.id.length === 0) {
            ensureUniqueId(el);
        }
        const pyEvent = 'py-' + browserEvent;
        const userProvidedFunctionName = el.getAttribute(pyEvent);

        el.addEventListener(browserEvent, (evt) => {
            try {
                await interpreter.run(source);
            } catch (e) {
                logger.error((e as Error).message);
            }
        } else {
            el.addEventListener(event, (evt) => {
                void (async () => {
                try {
                    const pyEval = await interpreter.globals.get('eval') //do i need globals here
                    const pyCallable = await interpreter.globals.get('callable')
                    const pyDictClass = await interpreter.globals.get('dict')

                    const localsDict = pyDictClass()
                    localsDict.set('event', evt)

                    const evalResult = pyEval(userProvidedFunctionName, interpreter.globals, localsDict)
                    const isCallable = pyCallable(evalResult)
                    
                    if (isCallable) {
                        const pyInspectModule = await interpreter.interface.pyimport('inspect')
                        const params = pyInspectModule.signature(evalResult).parameters
                   

                    if (params.length == 0) {
                        evalResult();
                    }
                    // Functions that receive an event attribute
                    else if (params.length == 1) {
                        evalResult(evt);
                    }
                else {
                    throw new UserError(ErrorCode.GENERIC, "py-events take 0 or 1 arguments")
                    }
                }
            }

            catch (err) {
                // TODO: This should be an error - probably need to refactor
                // this function into createSingularBanner
                createSingularWarning(err);
            }
        });
    }
    // }
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
    interpreter.run(source);
}
