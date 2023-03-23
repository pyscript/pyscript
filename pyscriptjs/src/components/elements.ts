import { InterpreterClient } from '../interpreter_client';
import type { PyScriptApp } from '../main';
import { make_PyRepl } from './pyrepl';
import { make_PyWidget } from './pywidget';

function createCustomElements(interpreter: InterpreterClient, app: PyScriptApp) {
    const PyWidget = make_PyWidget(interpreter);
    const PyRepl = make_PyRepl(interpreter, app);

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const xPyRepl = customElements.define('py-repl', PyRepl);
    const xPyWidget = customElements.define('py-register-widget', PyWidget);
    /* eslint-enable @typescript-eslint/no-unused-vars */
}

export { createCustomElements };
