import App from "./App.svelte";

import {EditorState, EditorView , basicSetup} from "@codemirror/basic-setup"

import { python } from "@codemirror/lang-python"
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { oneDarkTheme } from "@codemirror/theme-one-dark";

function addClasses(element: HTMLElement, classes: Array<string>){
    for (let entry of classes) {
      element.classList.add(entry);
    }
}

class PyScript extends HTMLElement {
  shadow: ShadowRoot;
  wrapper: HTMLElement;
  // editor: EditorView;
  editorNode: HTMLElement;
  code: string;
  cm: any;
  btnEdit: HTMLElement;
  btnRun: HTMLElement;
  editorOut: HTMLTextAreaElement;
  // editorState: EditorState;

  constructor() {
      super();

      // attach shadow so we can preserve the element original innerHtml content
      this.shadow = this.attachShadow({ mode: 'open'});

      this.wrapper = document.createElement('slot');

      // add an extra div where we can attach the codemirror editor
      this.editorNode = document.createElement('div');

      this.shadow.appendChild(this.wrapper);
      // this.shadow.appendChild(this.editorNode);
      // this.code = this.wrapper.innerHTML;
      console.log("Woooohooo");
    }
  connectedCallback() {

      this.code = this.innerHTML;
      this.innerHTML = '';
      let startState = EditorState.create({
        doc: this.code,
        extensions: [
            keymap.of(defaultKeymap),
            oneDarkTheme,
            // python()
        ]
    })

    let editor = new EditorView({
        state: startState,
        parent: this.editorNode
    })

    let mainDiv = document.createElement('div');
    addClasses(mainDiv, ["flex", "flex-col"])

    mainDiv.appendChild(this.editorNode);

    // Butons DIV
    var eDiv = document.createElement('div');
    // addClasses(eDiv, ["flex", "flex-row-reverse",  "justify-center", "rounded-lg", "text-lg", "mb-4"]);
    addClasses(eDiv, "flex flex-row-reverse space-x-reverse space-x-4 font-mono text-white text-sm font-bold leading-6 dev-buttons-group".split(" "))
    eDiv.setAttribute("role", "group");

    // RUN BUTTON
    this.btnRun = document.createElement('button');
    this.btnRun.innerHTML = "run";
    let buttonClasses = ["mr-2", "block", "py-2", "px-8", "rounded-full"];
    addClasses(this.btnRun, buttonClasses);
    addClasses(this.btnRun, ["text-green-100", "bg-green-500"])

    eDiv.appendChild(this.btnRun);


    this.btnEdit = document.createElement('button');
    this.btnEdit.innerHTML = "edit";
    addClasses(this.btnEdit, buttonClasses);
    addClasses(this.btnEdit, ["text-blue-100", "bg-blue-500"])
    eDiv.appendChild(this.btnEdit);


    this.editorOut = document.createElement('textarea');
    this.editorOut.classList.add("output");
    this.editorOut.disabled = true;
    mainDiv.appendChild(eDiv);
    mainDiv.appendChild(this.editorOut);
    this.appendChild(mainDiv);

    function addToOutput(s: string) {
      this.editorOut.value += ">>>" + s + "\n";
    }
    this.btnRun.onclick = evaluatePython;

    async function evaluatePython() {
      console.log('evaluate');
        // let pyodide = await pyodideReadyPromise;
        // try {
        // let output = pyodide.runPython(elem.editor.state.doc.toString());
        // addToOutput(output);
        // } catch (err) {
        // addToOutput(err);
        // }
    }

    console.log('connected');
  }

  render(){
    console.log('rendered');

  }
}

let xPyScript = customElements.define('py-script', PyScript);



const app = new App({
  target: document.body,
});

export default app;
