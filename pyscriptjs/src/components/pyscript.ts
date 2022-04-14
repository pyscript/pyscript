import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import { python } from "@codemirror/lang-python"
// @ts-ignore
import { StateCommand } from '@codemirror/state';
import { keymap, ViewUpdate } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { oneDarkTheme } from "@codemirror/theme-one-dark";

import { pyodideLoaded, loadedEnvironments, componentDetailsNavOpen, currentComponentDetails, mode, addToScriptsQueue, addInitializer, addPostInitializer } from '../stores';
import { addClasses } from '../utils';

// Premise used to connect to the first available pyodide interpreter
let pyodideReadyPromise;
let environments;
let currentMode;
let handlersCollected = false;

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

function createCmdHandler(el){
    // Creates a codemirror cmd handler that calls the el.evaluate when an event
    // triggers that specific cmd
    const toggleCheckbox:StateCommand = ({ state, dispatch }) => {
        return el.evaluate(state)
      }
    return toggleCheckbox
}

function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

class Script {
  source: string;
  state: string;
  target: string;
 
  constructor(source: string, target: string) {
    this.target = target;
    this.source = source;
    this.state = 'waiting';
  }
 
  async evaluate() {
    console.log('evaluate');
      let pyodide = await pyodideReadyPromise;
      // debugger
      try {
        // @ts-ignore
        // let source = this.editor.state.doc.toString();
        let output;
        if (this.source.includes("asyncio")){
          output = await pyodide.runPythonAsync(this.source);
        }else{
          output = pyodide.runPython(this.source);
        }

        if (this.target){
          // this.editorOut.innerHTML = s;
        }
        // if (output !== undefined){
        //   this.addToOutput(output);
        // }

        
    } catch (err) {
        console.log("OOOPS, this happened: " + err);
          // this.addToOutput(err);
      }
  }
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
    source: string;
    // editorState: EditorState;
  
    constructor() {
        super();
  
        // attach shadow so we can preserve the element original innerHtml content
        this.shadow = this.attachShadow({ mode: 'open'});
  
        this.wrapper = document.createElement('slot');
  
        // add an extra div where we can attach the codemirror editor
        this.editorNode = document.createElement('div');
        addClasses(this.editorNode, ["editor-box"])
        this.shadow.appendChild(this.wrapper);
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
      addClasses(mainDiv, ["parentBox", "flex", "flex-col", "border-4", "border-dashed", "border-gray-200", "rounded-lg"])
      // add Editor to main PyScript div
  
      // Butons DIV
      var eDiv = document.createElement('div');
      addClasses(eDiv, "buttons-box relative top-0 right-0 flex flex-row-reverse space-x-reverse space-x-4 font-mono text-white text-sm font-bold leading-6 dev-buttons-group".split(" "))
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
          {key:"target", value: "default"},
          {key: "source", value: "self"}
        ])
      }

      addClasses(this.btnConfig, buttonClasses);
      addClasses(this.btnConfig, ["bg-blue-500"])
      eDiv.appendChild(this.btnConfig);

      mainDiv.appendChild(eDiv);
      mainDiv.appendChild(this.editorNode);

      if (this.hasAttribute('target')) {
        this.editorOut = document.getElementById(this.getAttribute('target'));
      }else{
        // Editor Output Div
        this.editorOut = document.createElement('div');
        this.editorOut.classList.add("output");
        this.editorOut.hidden = true;

        // add the output div id there's not target
        mainDiv.appendChild(this.editorOut);
      }

      if (currentMode=="edit"){
        this.appendChild(mainDiv);
      }else{
        addToScriptsQueue(this);
      }

      console.log('connected');

      if (this.hasAttribute('src')) {
        this.source = this.getAttribute('src');
      }
    }

    addToOutput(s: string) {
        this.editorOut.innerHTML = s;
        this.editorOut.hidden = false;
      }

    async loadFromFile(s: string){
      let pyodide = await pyodideReadyPromise;
      let response = await fetch(s);
      this.code = await response.text();

      await pyodide.runPythonAsync(this.code);
      await pyodide.runPythonAsync(`
          from pyodide.http import pyfetch
          from pyodide import eval_code
          response = await pyfetch("`+s+`")
          content = await response.bytes()

          with open("todo.py", "wb") as f:
              print(content)
              f.write(content)
              print("done writing")
      `)
      // let pkg = pyodide.pyimport("todo");
      // pyodide.runPython(`
      //     import todo
      // `)
      // pkg.do_something();
    }

    async evaluate() {

        console.log('evaluate');
        if (this.source){
          this.loadFromFile(this.source)
        }else{
          let pyodide = await pyodideReadyPromise;
          // debugger
          try {
            function ltrim(code: string): string {
              const lines = code.split("\n")
              if (lines.length == 0)
                return code

              const lengths = lines
                .filter((line) => line.trim().length != 0)
                .map((line) => {
                  const [prefix] = line.match(/^\s*/)
                  return prefix.length
                })

              const k = Math.min(...lengths)

              if (k != 0)
                return lines.map((line) => line.substring(k)).join("\n")
              else
                return code
            }

            const str = this.editor.state.doc.toString()
            const source = htmlDecode(ltrim(str))

            let output
            if (source.includes("asyncio"))
              output = await pyodide.runPythonAsync(source)
            else
              output = pyodide.runPython(source)

            if (output !== undefined) {
              this.addToOutput(output)
            }

            if (this.hasAttribute('auto-generate') && this.parentElement.lastChild === this) {
                const newPyscript = document.createElement("py-script");
                newPyscript.setAttribute('auto-generate', null);
                this.parentElement.appendChild(newPyscript);
            }
        } catch (err) {
              this.addToOutput(err);
              console.log(err);
          }
        }
      }

    render(){
      console.log('rendered');
  
    }
  }

/** Initialize all elements with py-onClick handlers attributes  */
async function initHandlers() {
  console.log('Collecting nodes...'); 
  let pyodide = await pyodideReadyPromise;
  let matches : NodeListOf<HTMLElement> = document.querySelectorAll('[pys-onClick]');
  let output;
  let source;
  for (var el of matches) {
    let handlerCode = el.getAttribute('pys-onClick');
    source = `Element("${ el.id }").element.onclick = ${ handlerCode }`;
    output = await pyodide.runPythonAsync(source);

    // TODO: Should we actually map handlers in JS instaed of Python?
    // el.onclick = (evt: any) => {
    //   console.log("click");
    //   new Promise((resolve, reject) => {
    //     setTimeout(() => {
    //       console.log('Inside')
    //     }, 300);
    //   }).then(() => {
    //     console.log("resolved")
    //   });
    //   // let handlerCode = el.getAttribute('pys-onClick');
    //   // pyodide.runPython(handlerCode);
    // }
  }
  handlersCollected = true;

  matches = document.querySelectorAll('[pys-onKeyDown]');
  for (var el of matches) {
    let handlerCode = el.getAttribute('pys-onKeyDown');
    source = `Element("${ el.id }").element.addEventListener("keydown",  ${ handlerCode })`;
    output = await pyodide.runPythonAsync(source);
  }
}

/** Mount all elements with attribute py-mount into the Python namespace */
async function mountElements() {
  console.log('Collecting nodes to be mounted into python namespace...');
  let pyodide = await pyodideReadyPromise;
  let matches : NodeListOf<HTMLElement> = document.querySelectorAll('[py-mount]');
  let output;
  let source = "";
  for (var el of matches) {
    let mountName = el.getAttribute('py-mount');
    if (!mountName){
      mountName = el.id.replace("-", "_");
    }
    source += `\n${ mountName } = Element("${ el.id }")`;
  }
  await pyodide.runPythonAsync(source);
}
addInitializer(mountElements);
addPostInitializer(initHandlers);
