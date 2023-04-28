import { ltrim, htmlDecode, ensureUniqueId, createDeprecationWarning } from '../utils';
import { getLogger } from '../logger';
import { pyExec, displayPyException } from '../pyexec';
import { _createAlertBanner } from '../exceptions';
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
            for (const name of ['output', 'stderr']) {
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

        // callback used to bootstrap already known <script> tags
        const callback: MutationCallback = records => {
            for (const { addedNodes } of records) {
                for (const node of addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if ((node as PyScriptElement).matches(pyScriptCSS)) {
                            bootstrap(node as PyScriptElement);
                        }
                        for (const child of (node as PyScriptElement).querySelectorAll(pyScriptCSS)) {
                            bootstrap(child as PyScriptElement);
                        }
                    }
                }
            }
        };

        // globally shared MutationObserver for <script> special cases
        const pyScriptMO = new MutationObserver(callback);

        // simplifies observing any root node (document/shadowRoot)
        const observe = (root: Document | ShadowRoot) => {
            pyScriptMO.observe(root, { childList: true, subtree: true });
            return root;
        };

        // patch attachShadow once to bootstrap <script> special cases in there too
        const { attachShadow } = Element.prototype;
        Object.assign(Element.prototype, {
            attachShadow(init: ShadowRootInit) {
                return observe(attachShadow.call(this as Element, init));
            },
        });

        // bootstrap all already live py <script> tags
        callback([{ addedNodes: document.querySelectorAll(pyScriptCSS) } as unknown] as MutationRecord[], null);

        // once all tags have been initialized, observe new possible tags added later on
        // this is to save a few ticks within the callback as each <script> already adds a companion node
        observe(document);
    }

    return PyScript;
}

// Differently from CSS selectors, XPath can crawl attributes by name and select
// directly attribute nodes. This allows us to look for literally any `py-*` attribute.
// TODO: could we just depend on basic-devtools module?
// @see https://github.com/WebReflection/basic-devtools
const $x = (path: string, root: Document | HTMLElement = document): (Node | Attr)[] => {
    const expression = new XPathEvaluator().createExpression(path);
    const xpath = expression.evaluate(root, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
    const result = [];
    for (let i = 0, { snapshotLength } = xpath; i < snapshotLength; i++) {
        result.push(xpath.snapshotItem(i));
    }
    return result;
};

/** A weak relation between an element and current interpreter */
const elementInterpreter: WeakMap<Element, InterpreterClient> = new WeakMap();

/** Initialize all elements with py-* handlers attributes */
export function initHandlers(interpreter: InterpreterClient) {
    logger.debug('Initializing py-* event handlers...');
    for (const { name, ownerElement: el } of $x('//@*[starts-with(name(), "py-")]') as Attr[]) {
        createElementsWithEventListeners(interpreter, el, name.slice(3));
    }
}

/** An always same listeners to reduce RAM and enable future runtime changes via MO */
const pyScriptListener = async ({ type, currentTarget: el }) => {
    try {
        const interpreter = elementInterpreter.get(el);
        await interpreter.run(el.getAttribute(`py-${type as string}`));
    } catch (e) {
        const err = e as Error;
        displayPyException(err, el.parentElement);
    }
};

/** Weakly relate an element with an interpreter and then add the listener's type */
function createElementsWithEventListeners(interpreter: InterpreterClient, el: Element, type: string) {
    // If the element doesn't have an id, let's add one automatically!
    if (el.id.length === 0) {
        ensureUniqueId(el as HTMLElement);
    }
    elementInterpreter.set(el, interpreter);
    // Note: this is *NOT* a misused-promise, this is how async events work.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    el.addEventListener(type, pyScriptListener);
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
