import { getLogger } from './logger';
import { ensureUniqueId } from './utils';
import { UserError, ErrorCode } from './exceptions';
import { InterpreterClient } from './interpreter_client';
import type { PyProxyCallable, PyProxy } from 'pyodide';
import type { Remote } from 'synclink';

const logger = getLogger('pyexec');

export async function pyExec(
    interpreter: InterpreterClient,
    pysrc: string,
    outElem: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ result: any }> {
    const pyscript_py = (await interpreter.pyimport('pyscript')) as Remote<
        PyProxy & {
            set_current_display_target(id: string): void;
            uses_top_level_await(code: string): boolean;
        }
    >;
    ensureUniqueId(outElem);
    await pyscript_py.set_current_display_target(outElem.id);
    try {
        try {
            if (await pyscript_py.uses_top_level_await(pysrc)) {
                throw new UserError(
                    ErrorCode.TOP_LEVEL_AWAIT,
                    'The use of top-level "await", "async for", and ' +
                        '"async with" has been removed.' +
                        '\nPlease write a coroutine containing ' +
                        'your code and schedule it using asyncio.ensure_future() or similar.' +
                        '\nSee https://docs.pyscript.net/latest/guides/asyncio.html for more information.',
                );
            }
            return await interpreter.run(pysrc);
        } catch (e) {
            const err = e as Error;
            // XXX: currently we display exceptions in the same position as
            // the output. But we probably need a better way to do that,
            // e.g. allowing plugins to intercept exceptions and display them
            // in a configurable way.
            displayPyException(err, outElem);
            return { result: undefined };
        }
    } finally {
        await pyscript_py.set_current_display_target(undefined);
        await pyscript_py.destroy();
    }
}

/**
 * Javascript API to call the python display() function
 *
 * Expected usage:
 *     pyDisplay(interpreter, obj);
 *     pyDisplay(interpreter, obj, { target: targetID });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function pyDisplay(interpreter: InterpreterClient, obj: any, kwargs: { [k: string]: any } = {}) {
    const display = (await interpreter.globals.get('display')) as PyProxyCallable;
    try {
        await display.callKwargs(obj, kwargs);
    } finally {
        display.destroy();
    }
}

export function displayPyException(err: Error, errElem: HTMLElement) {
    //addClasses(errElem, ['py-error'])
    const pre = document.createElement('pre');
    pre.className = 'py-error';
    let errorCount = 0;
    const errorMsg = err.name === 'PythonError' ? err.message : err.toString();
    const pyErrorElements = document.getElementsByClassName('py-error');
    for (const pyErrorElement of pyErrorElements) {
        if ((pyErrorElement as HTMLElement).innerText.includes(errorMsg)) {
            errorCount++;
        }
    }
    if (errorCount === 0) {
        if (err.name === 'PythonError') {
            // err.message contains the python-level traceback (i.e. a string
            // starting with: "Traceback (most recent call last) ..."
            logger.error('Python exception:\n' + err.message);
            pre.innerText = err.message;
        } else {
            // this is very likely a normal JS exception. The best we can do is to
            // display it as is.
            logger.error('Non-python exception:\n' + err.toString());
            pre.innerText = err.toString();
        }
        errElem.appendChild(pre);
    }
}
