import type { Runtime } from '../runtime';
import { make_PyRepl } from './pyrepl';
import { PyBox } from './pybox';
import { make_PyButton } from './pybutton';
import { PyTitle } from './pytitle';
import { make_PyInputBox } from './pyinputbox';
import { make_PyWidget } from './pywidget';

function createCustomElements(runtime: Runtime) {
    const PyInputBox = make_PyInputBox(runtime);
    const PyButton = make_PyButton(runtime);
    const PyWidget = make_PyWidget(runtime);
    const PyRepl = make_PyRepl(runtime);

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
