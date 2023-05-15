import { $$, $x } from 'basic-devtools';

import { shadowRoots } from '../shadow_roots';
import { ltrim, htmlDecode, ensureUniqueId, createDeprecationWarning } from '../utils';
import { getLogger } from '../logger';
import { pyExec, displayPyException } from '../pyexec';
import { UserError, ErrorCode, _createAlertBanner } from '../exceptions';
import { robustFetch } from '../fetch';
import { PyScriptApp } from '../main';
import { Stdio } from '../stdio';
import { InterpreterClient } from '../interpreter_client';

const logger = getLogger('py-script');

// used to flag already initialized nodes
const knownPyScriptTags: WeakSet<HTMLElement> = new WeakSet();

export function make_PyScript(interpreter: InterpreterClient, app: PyScriptApp) {
    /**
     * A common <py-script> VS <script type="py"> initializator.
     */
    const init = async (pyScriptTag: PyScript, fallback: () => string) => {
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
            ensureUniqueId(pyScriptTag);
            const src = await fetchSource(pyScriptTag, fallback);
            await app.plugins.beforePyScriptExec({ interpreter, src, pyScriptTag });
            const { result } = await pyExec(interpreter, src, pyScriptTag);
            await app.plugins.afterPyScriptExec({ interpreter, src, pyScriptTag, result });
        } finally {
            releaseLock();
            app.decrementPendingTags();
        }
    };

    /**
     * Given a generic DOM Element, tries to fetch the 'src' attribute, if present.
     * It either throws an error if the 'src' can't be fetched or it returns a fallback
     * content as source.
     */
    const fetchSource = async (tag: Element, fallback: () => string): Promise<string> => {
        if (tag.hasAttribute('src')) {
            try {
                const response = await robustFetch(tag.getAttribute('src'));
                return await response.text();
            } catch (err) {
                const e = err as Error;
                _createAlertBanner(e.message);
                throw e;
            }
        }
        return fallback();
    };

    class PyScript extends HTMLElement {
        srcCode: string;
        stdout_manager: Stdio | null;
        stderr_manager: Stdio | null;
        _fetchSourceFallback = () => htmlDecode(this.srcCode);

        async connectedCallback() {
            // prevent multiple initialization of the same node if re-appended
            if (knownPyScriptTags.has(this)) return;
            knownPyScriptTags.add(this);

            // Save innerHTML information in srcCode so we can access it later
            // once we clean innerHTML (which is required since we don't want
            // source code to be rendered on the screen)
            this.srcCode = this.innerHTML;
            this.innerHTML = '';
            await init(this, this._fetchSourceFallback);
        }

        getPySrc(): Promise<string> {
            return fetchSource(this, this._fetchSourceFallback);
        }
    }

    // bootstrap the <script> tag fallback only if needed (once per definition)
    if (!customElements.get('py-script')) {
        // allow any HTMLScriptElement to behave like a PyScript custom-elelement
        type PyScriptElement = HTMLScriptElement & PyScript;

        // the <script> tags to look for, acting like a <py-script> one
        // both py, pyscript, and py-script, are valid types to help reducing typo cases
        const pyScriptCSS = 'script[type="py"],script[type="pyscript"],script[type="py-script"]';

        // bootstrap with the same connectedCallback logic any <script>
        const bootstrap = (script: PyScriptElement) => {
            // prevent multiple initialization of the same node if re-appended
            if (knownPyScriptTags.has(script)) return;
            knownPyScriptTags.add(script);

            const pyScriptTag = document.createElement('py-script-tag') as PyScript;

            // move attributes to the live resulting pyScriptTag reference
            for (const name of ['output', 'src', 'stderr']) {
                const value = script.getAttribute(name);
                if (value) {
                    pyScriptTag.setAttribute(name, value);
                }
            }

            // insert pyScriptTag companion right after the original script
            script.after(pyScriptTag);

            // remove the first empty line to preserve line numbers/counting
            init(pyScriptTag, () => ltrim(script.textContent.replace(/^[\r\n]+/, ''))).catch(() =>
                pyScriptTag.remove(),
            );
        };

        // loop over all py scripts and botstrap these
        const bootstrapScripts = (root: Document | Element) => {
            for (const node of $$(pyScriptCSS, root)) {
                bootstrap(node as PyScriptElement);
            }
        };

        // globally shared MutationObserver for <script> special cases
        const pyScriptMO = new MutationObserver(records => {
            for (const { type, target, attributeName, addedNodes } of records) {
                if (type === 'attributes') {
                    // consider only py-* attributes
                    if (attributeName.startsWith('py-')) {
                        // if the attribute is currently present
                        if ((target as Element).hasAttribute(attributeName)) {
                            // handle the element
                            addPyScriptEventListener(
                                getInterpreter(target as Element),
                                target as Element,
                                attributeName.slice(3),
                            );
                        } else {
                            // remove the listener because the element should not answer
                            // to this specific event anymore

                            // Note: this is *NOT* a misused-promise, this is how async events work.
                            // eslint-disable-next-line @typescript-eslint/no-misused-promises
                            target.removeEventListener(attributeName.slice(3), pyScriptListener);
                        }
                    }
                    // skip further loop on empty addedNodes
                    continue;
                }
                for (const node of addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if ((node as PyScriptElement).matches(pyScriptCSS)) {
                            bootstrap(node as PyScriptElement);
                        } else {
                            addAllPyScriptEventListeners(node as Element);
                            bootstrapScripts(node as Element);
                        }
                    }
                }
            }
        });

        // simplifies observing any root node (document/shadowRoot)
        const observe = (root: Document | ShadowRoot) => {
            pyScriptMO.observe(root, { childList: true, subtree: true, attributes: true });
            return root;
        };

        // patch attachShadow once to bootstrap <script> special cases in there too
        const { attachShadow } = Element.prototype;
        Object.assign(Element.prototype, {
            attachShadow(init: ShadowRootInit) {
                const shadowRoot = observe(attachShadow.call(this as Element, init));
                shadowRoots.add(shadowRoot);
                return shadowRoot;
            },
        });

        // bootstrap all already live py <script> tags
        bootstrapScripts(document);

        // once all tags have been initialized, observe new possible tags added later on
        // this is to save a few ticks within the callback as each <script> already adds a companion node
        observe(document);
    }

    return PyScript;
}

/** A weak relation between an element and current interpreter */
const elementInterpreter: WeakMap<Element, InterpreterClient> = new WeakMap();

/** Return the interpreter, if any, or vallback to the last known one */
const getInterpreter = (el: Element) => elementInterpreter.get(el) || lastInterpreter;

/** Retain last used interpreter to bootstrap PyScript to augment via MO runtime nodes */
let lastInterpreter: InterpreterClient;

/** Find all py-* attributes in a context node and its descendant + add listeners */
const addAllPyScriptEventListeners = (root: Document | Element) => {
    // note the XPath needs to start with a `.` to reference the starting root element
    const attributes = $x('.//@*[starts-with(name(), "py-")]', root) as Attr[];
    for (const { name, ownerElement: el } of attributes) {
        addPyScriptEventListener(getInterpreter(el), el, name.slice(3));
    }
};

/** Initialize all elements with py-* handlers attributes */
export function initHandlers(interpreter: InterpreterClient) {
    logger.debug('Initializing py-* event handlers...');
    lastInterpreter = interpreter;
    addAllPyScriptEventListeners(document);
}

/** An always-the-same event listener for py-[event] code handlers**/
const pyScriptEventHandler = async event => {
    const { type, currentTarget: el } = event;
    try {
        /*  here, we need to:
                - resolve the user-provided name to a Python object
                - determine whether that object is the name of a Callable
                    - If not, show and error
                - Determine the number of parameters of that Callable
                    - If it's 0, call it with no args
                    - If it's 1, call it with the event object
                    - If it's 2, show error
        */

        const client = elementInterpreter.get(el);

        const userCallableName: string | null = el.getAttribute(`py-${type as string}`);
        if (!userCallableName) return; // on missing/empty attribute, bail

        //check if the user-provided name refers to a Callable in the global namespace
        const userFunctionIsCallable = (await client.run(`callable(${userCallableName})`)).result;
        if (!userFunctionIsCallable) {
            throw new UserError(
                ErrorCode.EVENT_HANDLER_INVALID_NAME,
                "The value of 'py-[event]' should be the name " +
                    `of a function or Callable. (Got '${userCallableName}')\n` +
                    "To run an expression as code, use 'py-[event]-code'",
            );
        }

        // Use inspect.signature to get the number of parameters of the Callable:
        // TODO: When auto-syncify works, eliminate evaluating the user's provided
        // string a second time. Currently, cannot get signature of JsProxy object,
        // when the function reference is passed back into Pyodide
        const numParams: number | undefined = (
            await client.run(`
            from inspect import signature
            len(signature(${userCallableName}).parameters)
            `)
        ).result;

        const userCallable = (
            await client.run(`from pyodide.ffi import create_once_callable; create_once_callable(${userCallableName})`)
        ).result;

        if (numParams == 0) {
            userCallable().syncify();
        } else if (numParams == 1) {
            // The object is passed but not unwrapped, resulting in TypeErrors:
            // TypeError: __str__ returned non-string (type pyodide.JsProxy);
            // is this something to be fixed by 'auto-syncify'?
            userCallable(event);
        } else {
            throw new UserError(
                ErrorCode.EVENT_HANDLER_WRONG_ARG_COUNT,
                `The Callable specified by py-[event] should take zero or one ` +
                    `arguments; the provided callable takes ${numParams} arguments`,
            );
        }
    } catch (e) {
        const err = e as Error;
        displayPyException(err, el.parentElement);
    }
};

const pyScriptCodeRunner = async ({ type, currentTarget: el }) => {
    try {
        const interpreter = elementInterpreter.get(el);
        const userCode: string | null = el.getAttribute(`py-${type as string}-code`);
        if (userCode) {
            await interpreter.run(`eval("""${userCode}""")`);
        }
    } catch (e) {
        const err = e as Error;
        displayPyException(err, el.parentElement);
    }
};

/** Weakly relate an element with an interpreter and then add the listener's type */
function addPyScriptEventListener(interpreter: InterpreterClient, el: Element, type: string) {
    // If the element doesn't have an id, let's add one automatically!
    if (el.id.length === 0) {
        ensureUniqueId(el as HTMLElement);
    }
    elementInterpreter.set(el, interpreter);

    // Note: these are *NOT* misused-promises, this is how async events work.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (type.endsWith('-code')) el.addEventListener(type.slice(0, -5), pyScriptCodeRunner);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    else el.addEventListener(type, pyScriptEventHandler);
}

/** Mount all elements with attribute py-mount into the Python namespace */
export async function mountElements(interpreter: InterpreterClient) {
    const matches = $$('[py-mount]', document);
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

        await interpreter.run(source);
    }
}
