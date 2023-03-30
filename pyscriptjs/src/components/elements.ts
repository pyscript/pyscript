import { InterpreterClient } from '../interpreter_client';
import type { PyScriptApp } from '../main';
import { make_PyRepl } from './pyrepl';
import { make_PyWidget } from './pywidget';

function createCustomElements(interpreter: InterpreterClient, app: PyScriptApp) {
    const PyWidget = make_PyWidget(interpreter);
    const PyRepl = make_PyRepl(interpreter, app);

    customElements.define('py-repl', PyRepl);
    customElements.define('py-register-widget', PyWidget);
}

export { createCustomElements };
