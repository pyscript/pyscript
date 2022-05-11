import App from './App.svelte';

import { PyScript } from './components/pyscript';
import { PyRepl } from './components/pyrepl';
import { PyEnv } from './components/pyenv';
import { PyBox } from './components/pybox';
import { PyButton } from './components/pybutton';
import { PyTitle } from './components/pytitle';
import { PyInputBox } from './components/pyinputbox';
import { PyWidget } from './components/base';
import { PyLoader } from './components/pyloader';
import { globalLoader } from './stores';
import { PyConfig } from './components/pyconfig';

const xPyScript = customElements.define('py-script', PyScript);
const xPyRepl = customElements.define('py-repl', PyRepl);
const xPyEnv = customElements.define('py-env', PyEnv);
const xPyBox = customElements.define('py-box', PyBox);
const xPyButton = customElements.define('py-button', PyButton);
const xPyTitle = customElements.define('py-title', PyTitle);
const xPyInputBox = customElements.define('py-inputbox', PyInputBox);
const xPyWidget = customElements.define('py-register-widget', PyWidget);
const xPyLoader = customElements.define('py-loader', PyLoader);
const xPyConfig = customElements.define('py-config', PyConfig);

// As first thing, loop for application configs
const config: PyConfig = document.querySelector('py-config');
if (!config){
    const loader = document.createElement('py-config');
    document.body.append(loader);
}

// add loader to the page body
const loader = document.createElement('py-loader');
document.body.append(loader);
globalLoader.set(loader);

const app = new App({
    target: document.body,
});

export default app;
