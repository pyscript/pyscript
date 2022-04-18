import { pyodideLoaded, loadedEnvironments, componentDetailsNavOpen, mode } from '../stores';

// Premise used to connect to the first available pyodide interpreter
let pyodideReadyPromise;
let environments;
let currentMode;
let Element;

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

// TODO: use type declaractions
type PyodideInterface = {
    registerJsModule(name: string, module: object): void
}


export class BaseEvalElement extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    code: string;
    btnConfig: HTMLElement;
    btnRun: HTMLElement;
    outputElement: HTMLElement; //HTMLTextAreaElement;
    theme: string;
  
    constructor() {
        super();
  
        // attach shadow so we can preserve the element original innerHtml content
        this.shadow = this.attachShadow({ mode: 'open'});
        this.wrapper = document.createElement('slot');
        this.shadow.appendChild(this.wrapper);
      }

    addToOutput(s: string) {
        this.outputElement.innerHTML += "<div>"+s+"</div>";
        this.outputElement.hidden = false;
      }

    postEvaluate(){

    }

    getSource(): string{
        return "";
    }

    protected async _register_esm(pyodide: PyodideInterface): Promise<void> {
        const imports: {[key: string]: unknown} = {}
  
        for (const node of document.querySelectorAll("script[type='importmap']")) {
          const importmap = (() => {
            try {
              return JSON.parse(node.textContent)
            } catch {
              return null
            }
          })()
  
          if (importmap?.imports == null)
            continue
  
          for (const [name, url] of Object.entries(importmap.imports)) {
            if (typeof name != "string" || typeof url != "string")
              continue
  
            try {
              // XXX: pyodide doesn't like Module(), failing with
              // "can't read 'name' of undefined" at import time
              imports[name] = {...await import(url)}
            } catch {
              console.error(`failed to fetch '${url}' for '${name}'`)
            }
          }
        }
  
        pyodide.registerJsModule("esm", imports)
    }

    async evaluate() {
        console.log('evaluate');
          let pyodide = await pyodideReadyPromise;

          try {
            // @ts-ignore
            const source = this.getSource();
            await this._register_esm(pyodide)
            
            let output;

            if (source.includes("asyncio")){
              output = await pyodide.runPythonAsync(source);
              await pyodide.runPythonAsync(`output_manager.revert()`)
            }else{
              output = pyodide.runPython(source);
              pyodide.runPython(`output_manager.revert()`)
            }
            
            if (output !== undefined){
              if (Element === undefined){
                Element = pyodide.globals.get('Element');
              }
              const out = Element(this.outputElement.id);
              // @ts-ignore
              out.write.callKwargs(output, { append : true});

              if (!this.hasAttribute('target')) {
                this.outputElement.hidden =  false;
              }
            }

            this.postEvaluate()

            // if (this.hasAttribute('auto-generate')) {
            //     let nextExecId = parseInt(this.getAttribute('exec-id')) + 1;
            //     const newPyRepl = document.createElement("py-repl");
            //     newPyRepl.setAttribute('root', this.getAttribute('root'));
            //     newPyRepl.id = this.getAttribute('root') + "-" + nextExecId.toString();
            //     newPyRepl.setAttribute('auto-generate', null);
            //     if (this.hasAttribute('target')){
            //       newPyRepl.setAttribute('target', this.getAttribute('target'));
            //     }
                  
            //     newPyRepl.setAttribute('exec-id', nextExecId.toString());
            //     this.parentElement.appendChild(newPyRepl);
            // }
        } catch (err) {
              this.addToOutput(err);
          }
      }
  }
