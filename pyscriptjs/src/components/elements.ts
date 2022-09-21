import { PyRepl } from './pyrepl';
import { PyBox } from './pybox';
import { PyButton } from './pybutton';
import { PyTitle } from './pytitle';
import { PyInputBox } from './pyinputbox';
import { PyWidget } from './base';

/*
These were taken from main.js because some of our components call
runAfterRuntimeInitialized immediately when we are creating the custom
element, this was causing tests to fail since runAfterRuntimeInitialized
expects the runtime to have been loaded before being called.

This function is now called from within the `runtime.initialize`. Once
the runtime finished initializing, then we will create the custom elements
so they are rendered in the page and we will always have a runtime available.

Ideally, this would live under utils.js, but importing all the components in
the utils.js file was causing jest to fail with weird errors such as:
"ReferenceError: Cannot access 'BaseEvalElement' before initialization" coming
from the PyScript class.

*/
function createCustomElements() {
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
