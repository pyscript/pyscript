import type { Interpreter } from '../interpreter';
import { make_PyRepl } from './pyrepl';
import { PyBox } from './pybox';
import { make_PyButton } from './pybutton';
import { PyTitle } from './pytitle';
import { make_PyInputBox } from './pyinputbox';
import { make_PyWidget } from './pywidget';

function createCustomElements(interpreter: Interpreter) {
    const PyInputBox = make_PyInputBox(interpreter);
    const PyButton = make_PyButton(interpreter);
    const PyWidget = make_PyWidget(interpreter);
    const PyRepl = make_PyRepl(interpreter);

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const xPyRepl = customElements.define('py-repl', PyRepl);
    const xPyBox = customElements.define('py-box', PyBox);
    const xPyTitle = customElements.define('py-title', PyTitle);
    const xPyWidget = customElements.define('py-register-widget', PyWidget);
    const xPyInputBox = customElements.define('py-inputbox', PyInputBox);
    const xPyButton = customElements.define('py-button', PyButton);
    /* eslint-enable @typescript-eslint/no-unused-vars */
}

export { createCustomElements };
