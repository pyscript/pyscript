import { getLogger } from './logger';
import { ensureUniqueId, addClasses } from './utils';
import type { Runtime } from './runtime';

const logger = getLogger('pyexec');

export async function pyExec(runtime: Runtime, pysrc: string, outElem: HTMLElement)
{
    // this is the python function defined in pyscript.py
    const set_current_display_target = runtime.globals.get('set_current_display_target');
    ensureUniqueId(outElem);
    set_current_display_target(outElem.id);
    try {
        try {
            await runtime.run(pysrc);
        }
        catch (err) {
            // XXX: currently we display exceptions in the same position as
            // the output. But we probably need a better way to do that,
            // e.g. allowing plugins to intercept exceptions and display them
            // in a configurable way.
            displayPyException(err, outElem);
        }
    }
    finally {
        set_current_display_target(undefined);
    }
}


function displayPyException(err: any, errElem: HTMLElement) {
    //addClasses(errElem, ['py-error'])
    const pre = document.createElement('pre');
    pre.className = "py-error";

    if (err.name === "PythonError") {
        // err.message contains the python-level traceback (i.e. a string
        // starting with: "Traceback (most recent call last) ..."
        logger.error("Python exception:\n" + err.message);
        pre.innerText = err.message;
    }
    else {
        // this is very likely a normal JS exception. The best we can do is to
        // display it as is.
        logger.error("Non-python exception:\n" + err);
        pre.innerText = err;
    }
    errElem.appendChild(pre);
}


// XXX this is used by base.ts but should be removed once we complete the refactoring
export async function pyExecDontHandleErrors(runtime: Runtime, pysrc: string, out: HTMLElement)
{
    // this is the python function defined in pyscript.py
    const set_current_display_target = runtime.globals.get('set_current_display_target');
    ensureUniqueId(out);
    set_current_display_target(out.id);
    try {
        await runtime.run(pysrc);
    }
    finally {
        set_current_display_target(undefined);
    }
}
