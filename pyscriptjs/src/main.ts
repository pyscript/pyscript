import App from "./App.svelte";

import { PyScript } from "./components/pyscript";
import { PyRepl } from "./components/pyrepl";
import { PyEnv } from "./components/pyenv";
import { PyBox } from "./components/pybox";
import { PyButton } from "./components/pybutton";
import { PyTitle } from "./components/pytitle";
import { PyWidget } from "./components/base";

let xPyScript = customElements.define('py-script', PyScript);
let xPyRepl = customElements.define('py-repl', PyRepl);
let xPyEnv = customElements.define('py-env', PyEnv);
let xPyBox = customElements.define('py-box', PyBox);
let xPyButton = customElements.define('py-button', PyButton);
let xPyTitle = customElements.define('py-title', PyTitle);
let xPyWidget = customElements.define('py-register-widget', PyWidget);


const app = new App({
  target: document.body,
});

export default app;
