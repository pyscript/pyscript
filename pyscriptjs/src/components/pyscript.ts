import { htmlDecode, ensureUniqueId, createDeprecationWarning } from '../utils';
import { getLogger } from '../logger';
import { pyExec, displayPyException } from '../pyexec';
import { UserError, ErrorCode, _createAlertBanner } from '../exceptions';
import { robustFetch } from '../fetch';
import { PyScriptApp } from '../main';
import { Stdio } from '../stdio';
import { InterpreterClient } from '../interpreter_client';
import { PyProxyCallable } from 'pyodide';

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
const pyScriptEventHandler = async ({ type, currentTarget: el }) => {
    try {
        /*  here, we need to:
                - resolve the user-provided name to a Python object
                - determine whether that object is the name of a Callable
                - Determine the number of parameters of that Callable
                    - If it's 0, set up listener to call it with no args
                    - If it's 1, set up listener to call it with the event object
                    - If it's 2, show error/warning
        */

        const interpreter = elementInterpreter.get(el);
        const interf = interpreter._remote.interface

        const pyMethod = (await interf).runPython(`
            class SomeClass():
                def someMethod(self, param1):
                    print(f"This got 1 argument: {param1}")
            instance = SomeClass()
            instance.someMethod("foo")
            import inspect
            print(f"{len(inspect.signature(instance.someMethod).parameters)= }")
            instance.someMethod
        `)

        const pyInspectModule_x = await interf.pyimport('inspect').syncify()
        console.log(Object.keys(pyInspectModule_x))
        console.warn('Number of Parameters of dummy method:', await pyInspectModule_x.signature(pyMethod).parameters.length)

        const pyInspectModule = (await interpreter).pyimport('inspect')
        console.log()

        // Import create_proxy for later user
        await interpreter.run(`from pyodide.ffi import create_proxy`);

        // Get the value the user provided for their (hopefully) Callable
        const userFunctionName = el.getAttribute(`py-${type as string}`);

        // Get the Python object this name refers to
        const resolvedFunction = (
            await interpreter.run(`create_proxy(eval("""${userFunctionName}"""), roundtrip=False)`)
        ).result;

        // Get a reference to the Python function 'callable()'
        const pyCallable = (await interpreter.run(`create_proxy(callable)`)).result;

        // Check if the user's provided function is callable
        const userFunctionIsCallable = await pyCallable(resolvedFunction);
        if (!userFunctionIsCallable) {
            throw new UserError(
                ErrorCode.GENERIC,
                "The value of'py-[event]' should be the name " +
                    "of a function or Callable. To run an expression as code, use 'py-[event]-code'",
            );
        }

        const inspectModule = (await interpreter._remote.pyimport('inspect')) as unknown as {
            signature: (obj: any) => any;
        };
        console.log(await resolvedFunction.__repr__());
        const numParams = await inspectModule.signature(resolvedFunction); //TODO: Currently s
    } catch (e) {
        const err = e as Error;
        displayPyException(err, el.parentElement);
    }
};

const pyScriptCodeRunner = async ({ type, currentTarget: el }) => {
    try {
        const interpreter = elementInterpreter.get(el);
        const userCode = el.getAttribute(`py-${type as string}-code`);
        await interpreter.run(`eval("""${userCode}""")`);
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

    // Note: these are *NOT* misused-promises, this is how async events work.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (type.slice(-5) === '-code') el.addEventListener(type.slice(0, -5), pyScriptCodeRunner);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    else el.addEventListener(type, pyScriptEventHandler);
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
