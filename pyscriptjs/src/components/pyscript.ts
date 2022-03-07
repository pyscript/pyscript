import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import { python } from "@codemirror/lang-python"
import { StateCommand } from '@codemirror/state';
import { keymap, ViewUpdate } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { oneDarkTheme } from "@codemirror/theme-one-dark";


import { pyodideLoaded } from '../stores';
import { addClasses } from '../utils';
import { debug } from "svelte/internal";

// Premise used to connect to the first available pyodide interpreter
let pyodideReadyPromise;

pyodideLoaded.subscribe(value => {
  pyodideReadyPromise = value;
});

function createCmdHandler(el){
    // Creates a codemirror cmd handler that calls the el.evaluate when an event
    // triggers that specific cmd
    const toggleCheckbox:StateCommand = ({ state, dispatch }) => {
        return el.evaluate(state)
      }
    return toggleCheckbox
}


export class PyScript extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    editor: EditorView;
    editorNode: HTMLElement;
    code: string;
    cm: any;
    btnConfig: HTMLElement;
    btnRun: HTMLElement;
    editorOut: HTMLElement; //HTMLTextAreaElement;
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
              keymap.of([
                    ...defaultKeymap,
                    { key: "Ctrl-Enter", run: createCmdHandler(this) },
                    { key: "Shift-Enter", run: createCmdHandler(this) }
              ]),
              oneDarkTheme,
              python(),
              // Event listener function that is called every time an user types something on this editor
            //   EditorView.updateListener.of((v:ViewUpdate) => {
            //     if (v.docChanged) {
            //       console.log(v.changes);

            //     }
            // })
          ]
      })
  
      this.editor = new EditorView({
          state: startState,
          parent: this.editorNode
      })
  
      let mainDiv = document.createElement('div');
      addClasses(mainDiv, ["flex", "flex-col", "border-4", "border-dashed", "border-gray-200", "rounded-lg"])
  
      mainDiv.appendChild(this.editorNode);
  
      // Butons DIV
      var eDiv = document.createElement('div');
      addClasses(eDiv, "flex flex-row-reverse space-x-reverse space-x-4 font-mono text-white text-sm font-bold leading-6 dev-buttons-group".split(" "))
      eDiv.setAttribute("role", "group");
  
      // RUN BUTTON
      this.btnRun = document.createElement('button');
      this.btnRun.innerHTML = "run";
      let buttonClasses = ["mr-2", "block", "py-2", "px-8", "rounded-full"];
      addClasses(this.btnRun, buttonClasses);
      addClasses(this.btnRun, ["text-green-100", "bg-green-500"])
      eDiv.appendChild(this.btnRun);
  
  
      this.btnConfig = document.createElement('button');
      this.btnConfig.innerHTML = "config";
      addClasses(this.btnConfig, buttonClasses);
      addClasses(this.btnConfig, ["text-blue-100", "bg-blue-500"])
      eDiv.appendChild(this.btnConfig);
  
  
      this.editorOut = document.createElement('div');
      this.editorOut.classList.add("output");
      this.editorOut.hidden = true;
      mainDiv.appendChild(eDiv);
      mainDiv.appendChild(this.editorOut);
      this.appendChild(mainDiv);
      this.btnRun.onclick = wrap(this);
  
      function wrap(el: any){
        async function evaluatePython() {
            el.evaluate()
        }
        return evaluatePython;
      }
  
  
      console.log('connected');
    }

    addToOutput(s: string) {
        this.editorOut.innerHTML = s;
        this.editorOut.hidden = false;
      }

    async evaluate() {
        console.log('evaluate');
          let pyodide = await pyodideReadyPromise;
          // debugger
          try {

            // @ts-ignore
            let output = pyodide.runPython(this.editor.state.doc.toString());
            if (output !== undefined){
              this.addToOutput(output);
            }

              // debugger
            } catch (err) {
              this.addToOutput(err);
          }
      }
  
    render(){
      console.log('rendered');
  
    }
  }

  