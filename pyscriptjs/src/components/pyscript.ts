import { htmlDecode, ensureUniqueId, createDeprecationWarning } from '../utils';
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
function createElementsWithEventListeners(interpreter: InterpreterClient, browserEvent: string) {
    const matches: NodeListOf<HTMLElement> = document.querySelectorAll(`[py-${browserEvent}], [py-${browserEvent}-code]`);

    const pyEval = interpreter.globals.get('eval')
    const pyCallable = interpreter.globals.get('callable')
    const pyDictClass = interpreter.globals.get('dict')

    const localsDict = pyDictClass()

    for (const el of matches) {
        console.log('🌈?? el:', el)
        // If the element doesn't have an id, let's add one automatically
        if (el.id.length === 0) {
            ensureUniqueId(el);
        }

        if (el.getAttributeNames().find(s => s.includes('code'))) {
            console.log('element ☠️ code')
            const pyEvent = 'py-' + browserEvent + '-code';
            const userProvidedFunctionName = el.getAttribute(pyEvent);
            el.addEventListener(browserEvent, (evt) => {
                try {
                    console.log('🦊 userProvidedFunctionName:', userProvidedFunctionName)
                    const evalResult = pyEval(userProvidedFunctionName, interpreter.globals, localsDict)
                    const isCallable = pyCallable(evalResult)
                    localsDict.set('event', evt)

                    if (isCallable) {
                        console.log('isCallable inside the code stuff')
                        throw new UserError(ErrorCode.GENERIC, "The code provided to 'py-[event]-code' was the name of a Callable. Did you mean to use 'py-[event]?")
                    }
                    // const isCallable = pyCallable(evalResult)
                    //
                    // if (isCallable) {
                    // }
                    // else {
                    //     console.log('else twice?')
                        // pyEval(userProvidedFunctionName, interpreter.globals, localsDict);
                        // // Functions that receive an event attribute
                        // else if (params.length == 1) {
                        //     evalResult(evt);
                        // }
                    // }
                }
                catch (err) {
                    // TODO: This should be an error - probably need to refactor
                    // this function into createSingularBanner similar to createSingularWarning(err);
                    // tracked in issue #1253
                    displayPyException(err, el.parentElement);
                }
            });
        }
        else {
            console.log('element 🍑 thats not code')
            const pyEvent = 'py-' + browserEvent;
            const userProvidedFunctionName = el.getAttribute(pyEvent);

            // TODO: this if statement is deprecated and should be removed in version coming after 2023.03.1
            const possibleDeprecatedPysEvent = 'pys-' + browserEvent;
            if (possibleDeprecatedPysEvent === 'pys-onClick' || possibleDeprecatedPysEvent === 'pys-onKeyDown') {
                const msg =
                    `The attribute 'pys-onClick' and 'pys-onKeyDown' are deprecated. Please 'py-click="myFunction()"' ` +
                    ` or 'py-keydown="myFunction()"' instead.`;
                createDeprecationWarning(msg, msg);
                const source = `
                from pyodide.ffi import create_proxy
                Element("${el.id}").element.addEventListener("${browserEvent}",  create_proxy(${userProvidedFunctionName}))
                `;
                // We need to run the source code in a try/catch block, because
                // the source code may contain a syntax error, which will cause
                // the splashscreen to not be removed.
                try {
                    interpreter.run(source);
                } catch (e) {
                    logger.error((e as Error).message);
                }
            } else {
                el.addEventListener(browserEvent, (evt) => {
                    try {
                        console.log('also bein eval here')
                        const evalResult = pyEval(userProvidedFunctionName, interpreter.globals, localsDict)
                        const isCallable = pyCallable(evalResult)
                        localsDict.set('event', evt)

                        if (isCallable) {
                            console.log('is callable 🌨️')
                            const pyInspectModule = interpreter._remote.interface.pyimport('inspect')
                            const params = pyInspectModule.signature(evalResult).parameters

                            if (params.length == 0) {
                                evalResult();
                            }
                            // Functions that receive an event attribute
                            else if (params.length == 1) {
                                evalResult(evt);
                            } else {
                                throw new UserError(ErrorCode.GENERIC, "'py-[event]' take 0 or 1 arguments")
                            }
                        }
                        else {
                            throw new UserError(ErrorCode.GENERIC, "The code provided to 'py-[event]' should be the name of a function or Callable. To run an expression as code, use 'py-[event]-code'")
                        }
                    } catch (err) {
                        // TODO: This should be an error - probably need to refactor
                        // this function into createSingularBanner similar to createSingularWarning(err);
                        // tracked in issue #1253
                        displayPyException(err, el.parentElement);
                    }
                });
            }
        }
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
    await interpreter.run(source);
}
