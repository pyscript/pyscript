// import { EditorState } from "@codemirror/state";
import {EditorState, EditorView , basicSetup} from "@codemirror/basic-setup"
// import {gutter, GutterMarker} from "@codemirror/gutter"

import { python } from "@codemirror/lang-python"
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { oneDarkTheme } from "@codemirror/theme-one-dark";
// @codemirror/lang-python

import { loadInterpreter } from "./interpreter";
// import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
// import {javascript} from "@codemirror/lang-javascript"


class PyScript extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    editor: EditorView;
    editorNode: HTMLElement;
    code: string;
    cm: any;
    btnEdit: HTMLElement;
    btnRun: HTMLElement;
    editorOut: HTMLTextAreaElement;
    editorState: EditorState;

    constructor() {
        super();
        
        // attach shadow so we can preserve the element original innerHtml content
        this.shadow = this.attachShadow({ mode: 'open'});

        this.wrapper = document.createElement('slot');

        // add an extra div where we can attach the codemirror editor
        this.editorNode = document.createElement('div');
        
        this.shadow.appendChild(this.wrapper);
        this.shadow.appendChild(this.editorNode);
        this.code = this.wrapper.innerHTML;
      }
    connectedCallback() {
      
    }

    render(){
        // debugger;
    }
  }
  
  let xPyScript = customElements.define('py-script', PyScript);


  function create_menu (){
    let leftBar = document.createElement("div");
        
    // example: https://codepen.io/Markshall/pen/wQyWqq
    leftBar.innerHTML = `
    <div class="adminActions">
    <input type="checkbox" name="adminToggle" class="adminToggle" />
    <a class="adminButton" href="#!"><i class="fa fa-cog">+</i></a>
    <div class="adminButtons">
        <a href="#" title="Add Company"><i class="fa fa-building">Script</i></a>
        <a href="#" title="Edit Company"><i class="fa fa-pen">Panel</i></a>
        <a href="#" title="Add User"><i class="fa fa-user-plus">Button</i></a>
        <a href="#" title="Edit User"><i class="fa fa-user-edit">TextArea</i></a>
    </div>
    </div>
    `;
    document.body.appendChild(leftBar);

    
      document.querySelectorAll('py-script').forEach((elem: PyScript, i) => {
            let code = elem.innerHTML;
            elem.innerHTML = "";
            elem.code = code;

            let startState = EditorState.create({
                doc: code,
                extensions: [
                    keymap.of(defaultKeymap),
                    oneDarkTheme,
                    // python()
                ]
            })

            let view = new EditorView({
                state: startState,

                parent: elem
            })

            // elem.cm = CodeMirror(elem, {
            //     lineNumbers: true,
            //     tabSize: 2,
            //     value: code,
            //     mode: 'python'
            // });
            elem.editor = view;
            elem.btnRun = document.createElement('button');
            elem.btnRun.innerHTML = "run";
            elem.btnRun.classList.add("run");
            
            elem.appendChild(elem.btnRun);

            elem.btnEdit = document.createElement('button');
            elem.btnEdit.innerHTML = "edit";
            elem.btnEdit.classList.add("edit");
            elem.appendChild(elem.btnEdit);

            var eDiv = document.createElement('div');

            elem.editorOut = document.createElement('textarea');
            elem.editorOut.classList.add("output");
            elem.editorOut.disabled = true;
            eDiv.appendChild(elem.editorOut);
            elem.appendChild(eDiv);

            function addToOutput(s: string) {
                elem.editorOut.value += ">>>" + s + "\n";
            }
            elem.btnRun.onclick = evaluatePython;

            async function evaluatePython() {
                let pyodide = await pyodideReadyPromise;
                try {
                let output = pyodide.runPython(elem.editor.state.doc.toString());
                addToOutput(output);
                } catch (err) {
                addToOutput(err);
                }
            }
            
            
      });
    }
    
    window.onload= create_menu;

    // async function main() {
    //     let pyodide = await loadPyodide({ /* @ts-ignore */
    //       indexURL: "https://cdn.jsdelivr.net/pyodide/v0.19.0/full/",
    //     }); /* @ts-ignore */
    
    //     return pyodide;
    //   }
    let pyodideReadyPromise = loadInterpreter();

    

