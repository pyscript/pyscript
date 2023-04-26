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
