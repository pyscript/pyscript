import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import { python } from "@codemirror/lang-python"
// @ts-ignore
import { StateCommand, Compartment } from '@codemirror/state';
import { keymap, ViewUpdate } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { oneDarkTheme } from "@codemirror/theme-one-dark";

import { pyodideLoaded, loadedEnvironments, componentDetailsNavOpen, currentComponentDetails, mode } from '../stores';
import { addClasses } from '../utils';
import { BaseEvalElement } from './base';

// Premise used to connect to the first available pyodide interpreter
let pyodideReadyPromise;
let environments;
let currentMode;

pyodideLoaded.subscribe(value => {
  pyodideReadyPromise = value;
});
loadedEnvironments.subscribe(value => {
    environments = value;
});

let propertiesNavOpen;
componentDetailsNavOpen.subscribe(value => {
  propertiesNavOpen = value;
});

mode.subscribe(value => {
  currentMode = value;
});


const languageConf = new Compartment

function createCmdHandler(el){
    // Creates a codemirror cmd handler that calls the el.evaluate when an event
    // triggers that specific cmd
    const toggleCheckbox:StateCommand = ({ state, dispatch }) => {
        return el.evaluate(state)
      }
    return toggleCheckbox
}


export class PyRepl extends BaseEvalElement {
    editor: EditorView;
    editorNode: HTMLElement;
    code: string;
    theme: string;
  
    constructor() {
        super();
  
        // add an extra div where we can attach the codemirror editor
        this.editorNode = document.createElement('div');
        addClasses(this.editorNode, ["editor-box"])
        this.shadow.appendChild(this.wrapper);
      }


    connectedCallback() {
        this.code = this.innerHTML;
        this.innerHTML = '';

        let extensions = [
          basicSetup,
            languageConf.of(python()),
            keymap.of([
                  ...defaultKeymap,
                  { key: "Ctrl-Enter", run: createCmdHandler(this) },
                  { key: "Shift-Enter", run: createCmdHandler(this) }
            ]),
            
            // Event listener function that is called every time an user types something on this editor
          //   EditorView.updateListener.of((v:ViewUpdate) => {
          //     if (v.docChanged) {
          //       console.log(v.changes);

          //     }
          // })
        ];
        
        if (!this.hasAttribute('theme')) {
          this.theme = this.getAttribute('theme');
          if (this.theme == 'dark'){
            extensions.push(oneDarkTheme);
          }
        }
        
        let startState = EditorState.create({
          doc: this.code.trim(),
          extensions: extensions
      })
  
      this.editor = new EditorView({
          state: startState,
          parent: this.editorNode
      })
  
      let mainDiv = document.createElement('div');
      addClasses(mainDiv, ["parentBox", "group", "flex", "flex-col", "mt-2", "border-2", "border-gray-200", "rounded-lg"])
      // add Editor to main PyScript div
  
      // Butons DIV
      var eDiv = document.createElement('div');
      addClasses(eDiv, "buttons-box opacity-0 group-hover:opacity-100 relative top-0 right-0 flex flex-row-reverse space-x-reverse space-x-4 font-mono text-white text-sm font-bold leading-6 dev-buttons-group".split(" "))
      eDiv.setAttribute("role", "group");
  
      // Play Button
      this.btnRun = document.createElement('button');
      this.btnRun.innerHTML = '<svg id="" class="svelte-fa svelte-ps5qeg" style="height:1em;vertical-align:-.125em;transform-origin:center;overflow:visible" viewBox="0 0 384 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(192 256)" transform-origin="96 0"><g transform="translate(0,0) scale(1,1)"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" fill="currentColor" transform="translate(-192 -256)"></path></g></g></svg>';
      let buttonClasses = ["mr-2", "block", "py-2", "px-4", "rounded-full"];
      addClasses(this.btnRun, buttonClasses);
      addClasses(this.btnRun, ["bg-green-500"])
      eDiv.appendChild(this.btnRun);

      this.btnRun.onclick = wrap(this);
  
      function wrap(el: any){
        async function evaluatePython() {
            el.evaluate()
        }
        return evaluatePython;
      }
  
      // Settings button
      this.btnConfig = document.createElement('button');
      this.btnConfig.innerHTML = '<svg id="" class="svelte-fa svelte-ps5qeg" style="height:1em;vertical-align:-.125em;transform-origin:center;overflow:visible" viewBox="0 0 512 512" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"><g transform="translate(256 256)" transform-origin="128 0"><g transform="translate(0,0) scale(1,1)"><path d="M495.9 166.6C499.2 175.2 496.4 184.9 489.6 191.2L446.3 230.6C447.4 238.9 448 247.4 448 256C448 264.6 447.4 273.1 446.3 281.4L489.6 320.8C496.4 327.1 499.2 336.8 495.9 345.4C491.5 357.3 486.2 368.8 480.2 379.7L475.5 387.8C468.9 398.8 461.5 409.2 453.4 419.1C447.4 426.2 437.7 428.7 428.9 425.9L373.2 408.1C359.8 418.4 344.1 427 329.2 433.6L316.7 490.7C314.7 499.7 307.7 506.1 298.5 508.5C284.7 510.8 270.5 512 255.1 512C241.5 512 227.3 510.8 213.5 508.5C204.3 506.1 197.3 499.7 195.3 490.7L182.8 433.6C167 427 152.2 418.4 138.8 408.1L83.14 425.9C74.3 428.7 64.55 426.2 58.63 419.1C50.52 409.2 43.12 398.8 36.52 387.8L31.84 379.7C25.77 368.8 20.49 357.3 16.06 345.4C12.82 336.8 15.55 327.1 22.41 320.8L65.67 281.4C64.57 273.1 64 264.6 64 256C64 247.4 64.57 238.9 65.67 230.6L22.41 191.2C15.55 184.9 12.82 175.3 16.06 166.6C20.49 154.7 25.78 143.2 31.84 132.3L36.51 124.2C43.12 113.2 50.52 102.8 58.63 92.95C64.55 85.8 74.3 83.32 83.14 86.14L138.8 103.9C152.2 93.56 167 84.96 182.8 78.43L195.3 21.33C197.3 12.25 204.3 5.04 213.5 3.51C227.3 1.201 241.5 0 256 0C270.5 0 284.7 1.201 298.5 3.51C307.7 5.04 314.7 12.25 316.7 21.33L329.2 78.43C344.1 84.96 359.8 93.56 373.2 103.9L428.9 86.14C437.7 83.32 447.4 85.8 453.4 92.95C461.5 102.8 468.9 113.2 475.5 124.2L480.2 132.3C486.2 143.2 491.5 154.7 495.9 166.6V166.6zM256 336C300.2 336 336 300.2 336 255.1C336 211.8 300.2 175.1 256 175.1C211.8 175.1 176 211.8 176 255.1C176 300.2 211.8 336 256 336z" fill="currentColor" transform="translate(-256 -256)"></path></g></g></svg>';
      this.btnConfig.onclick = function toggleNavBar(evt){
        console.log('clicked');
        componentDetailsNavOpen.set(!propertiesNavOpen);

        currentComponentDetails.set([
          {key: "auto-generate",  value: true},
          {key:"output", value: "default"},
          {key: "source", value: "self"},
          {key: "output-mode", value: "clear"}
        ])
      }

      addClasses(this.btnConfig, buttonClasses);
      addClasses(this.btnConfig, ["bg-blue-500"])
      eDiv.appendChild(this.btnConfig);
    

      mainDiv.appendChild(eDiv);
      mainDiv.appendChild(this.editorNode);

      if (!this.id){
        console.log("WARNING: <pyrepl> define with an id. <pyrepl> should always have an id. More than one <pyrepl> on a page won't work otherwise!")
      }

      if (!this.hasAttribute('exec-id')) {
        this.setAttribute("exec-id", "1");
      }

      if (!this.hasAttribute('root')) {
        this.setAttribute("root", this.id);
      }

      if (this.hasAttribute('output')) {
        this.errorElement = this.outputElement = document.getElementById(this.getAttribute('output'));

        // in this case, the default output-mode is append, if hasn't been specified
        if (!this.hasAttribute('output-mode')) {
          this.setAttribute('output-mode', 'append');
        }
      }else{
        if (this.hasAttribute('std-out')){
          this.outputElement = document.getElementById(this.getAttribute('std-out'));
        }else{
          // In this case neither output or std-out have been provided so we need
          // to create a new output div to output to
          this.outputElement = document.createElement('div');
          this.outputElement.classList.add("output");
          this.outputElement.hidden = true;
          this.outputElement.id = this.id + "-" + this.getAttribute("exec-id");

          // add the output div id if there's not output pre-defined
          mainDiv.appendChild(this.outputElement);
        }

        if (this.hasAttribute('std-err')){
          this.errorElement = document.getElementById(this.getAttribute('std-err'));
        }else{
          this.errorElement = this.outputElement;
        }
      }


      this.appendChild(mainDiv);      
      this.editor.focus();
      console.log('connected');
    }

    addToOutput(s: string) {
        this.outputElement.innerHTML += "<div>"+s+"</div>";
        this.outputElement.hidden = false;
      }

    postEvaluate(): void {
      if (this.hasAttribute('auto-generate')) {
        let nextExecId = parseInt(this.getAttribute('exec-id')) + 1;
        const newPyRepl = document.createElement("py-repl");
        newPyRepl.setAttribute('root', this.getAttribute('root'));
        newPyRepl.id = this.getAttribute('root') + "-" + nextExecId.toString();
        newPyRepl.setAttribute('auto-generate', null);
        if (this.hasAttribute('output')){
          newPyRepl.setAttribute('output', this.getAttribute('output'));
        }
        if (this.hasAttribute('std-out')){
          newPyRepl.setAttribute('std-out', this.getAttribute('std-out'));
        }
        if (this.hasAttribute('std-err')){
          newPyRepl.setAttribute('std-err', this.getAttribute('std-err'));
        }
          
        newPyRepl.setAttribute('exec-id', nextExecId.toString());
        this.parentElement.appendChild(newPyRepl);
      }
    }

    getSourceFromElement(): string {
      const sourceStrings = [`output_manager.change("`+this.outputElement.id+`")`, 
              ...this.editor.state.doc.toString().split("\n")];
      return sourceStrings.join('\n')
    }

    render(){
      console.log('rendered');
  
    }
  }

