import App from "./App.svelte";

import {EditorState, EditorView , basicSetup} from "@codemirror/basic-setup"
import { python } from "@codemirror/lang-python"
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { oneDarkTheme } from "@codemirror/theme-one-dark";
import { PyScript } from "./components/pyscript";
import { PyRepl } from "./components/pyrepl";


let xPyScript = customElements.define('py-script', PyScript);
let xPyRepl = customElements.define('py-repl', PyRepl);


const app = new App({
  target: document.body,
});

export default app;
