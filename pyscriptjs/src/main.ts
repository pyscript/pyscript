import App from "./App.svelte";

import { PyScript } from "./components/pyscript";
import { PyRepl } from "./components/pyrepl";
import { PyEnv } from "./components/pyenv"


let xPyScript = customElements.define('py-script', PyScript);
let xPyRepl = customElements.define('py-repl', PyRepl);
let xPyEnv = customElements.define('py-env', PyEnv);


const app = new App({
  target: document.body,
});

export default app;
