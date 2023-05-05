import { InterpreterClient } from '../interpreter_client';
import type { PyScriptApp } from '../main';
import { make_PyRepl } from './pyrepl';

function createCustomElements(interpreter: InterpreterClient, app: PyScriptApp) {
    const PyRepl = make_PyRepl(interpreter, app);

    customElements.define('py-repl', PyRepl);
}

export { createCustomElements };
