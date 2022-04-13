import { addClasses } from '../utils';

// Premise used to connect to the first available pyodide interpreter
// let pyodideReadyPromise;
// let environments;
// let currentMode;

// pyodideLoaded.subscribe(value => {
//   pyodideReadyPromise = value;
// });
// loadedEnvironments.subscribe(value => {
//     environments = value;
// });

// let propertiesNavOpen;
// componentDetailsNavOpen.subscribe(value => {
//   propertiesNavOpen = value;
// });

// mode.subscribe(value => {
//   currentMode = value;
// });


export class PyBox extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    theme: string;
    widths: Array<string>;
    // editorState: EditorState;
  
    constructor() {
        super();
  
        // attach shadow so we can preserve the element original innerHtml content
        this.shadow = this.attachShadow({ mode: 'open'});
  
        this.wrapper = document.createElement('slot');
        this.shadow.appendChild(this.wrapper);
      }


    connectedCallback() {
        this.innerHTML = '';
  
      let mainDiv = document.createElement('div');
      addClasses(mainDiv, ["flex"])
      // add Editor to main PyScript div
      debugger
      // mainDiv.appendChild(eDiv);
      // mainDiv.appendChild(this.editorNode);

      if (!this.id){
        console.log("WARNING: <pyrepl> define with an id. <pyrepl> should always have an id. More than one <pyrepl> on a page won't work otherwise!")
      }

      if (!this.hasAttribute('widths')) {
        this.setAttribute("exec-id", "1");
      }


      this.appendChild(mainDiv);      

      console.log('connected');
    }
  }

  