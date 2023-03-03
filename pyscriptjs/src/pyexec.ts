import { getLogger } from './logger';
import { ensureUniqueId } from './utils';
import { UserError, ErrorCode } from './exceptions';
import { InterpreterClient } from './interpreter_client';

const logger = getLogger('pyexec');

export async function pyExec(interpreter: InterpreterClient, pysrc: string, outElem: HTMLElement) {
    //This is pyscript.py
    const pyscript_py = interpreter._remote.interface.pyimport('pyscript');
    ensureUniqueId(outElem);
    pyscript_py.set_current_display_target(outElem.id);
    try {
        try {
            if (pyscript_py.uses_top_level_await(pysrc)) {
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
        } catch (err) {
            // XXX: currently we display exceptions in the same position as
            // the output. But we probably need a better way to do that,
            // e.g. allowing plugins to intercept exceptions and display them
            // in a configurable way.
            displayPyException(err, outElem);
            return { result: undefined };
        }
    } finally {
        pyscript_py.set_current_display_target(undefined);
        pyscript_py.destroy();
    }
}

/**
 * Javascript API to call the python display() function
 *
 * Expected usage:
 *     pyDisplay(interpreter, obj);
 *     pyDisplay(interpreter, obj, { target: targetID });
 */
export function pyDisplay(interpreter: InterpreterClient, obj: any, kwargs: object) {
    const display = interpreter.globals.get('display');
    if (kwargs === undefined) display(obj);
    else {
        display.callKwargs(obj, kwargs);
    }
}

export function displayPyException(err: any, errElem: HTMLElement) {
    //addClasses(errElem, ['py-error'])
    const pre = document.createElement('pre');
    pre.className = 'py-error';

    if (err.name === 'PythonError') {
        // err.message contains the python-level traceback (i.e. a string
        // starting with: "Traceback (most recent call last) ..."
        logger.error('Python exception:\n' + err.message);
        pre.innerText = err.message;
    } else {
        // this is very likely a normal JS exception. The best we can do is to
        // display it as is.
        logger.error('Non-python exception:\n' + err);
        pre.innerText = err;
    }
    errElem.appendChild(pre);
}
