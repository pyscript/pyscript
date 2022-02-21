let message: string = 'Hello World';
console.log(message);

class PyScript extends HTMLElement {
    shadow: ShadowRoot;
    wrapper: HTMLElement;
    editor: HTMLElement;
    code: string;
    cm: any;
    btnEdit: HTMLElement;
    btnRun: HTMLElement;
    editorOut: HTMLTextAreaElement;

    constructor() {
        super();
        
        // attach shadow so we can preserve the element original innerHtml content
        this.shadow = this.attachShadow({ mode: 'open'});

        this.wrapper = document.createElement('slot');

        // add an extra div where we can attach the codemirror editor
        this.editor = document.createElement('div');
        
        this.shadow.appendChild(this.wrapper);
        this.shadow.appendChild(this.editor);
        this.code = this.wrapper.innerHTML;
      }
    connectedCallback() {
      
    }

    render(){
        // debugger;
    }
  }
  
  customElements.define('py-script', PyScript);


  function create_menu (){
    
      var div = document.createElement("div");

      div.innerHTML = `
        <div class="adminActions">
        <input type="checkbox" name="adminToggle" class="adminToggle" />
        <a class="adminButton" href="#!"><i class="fa fa-cog"></i></a>
        <div class="adminButtons">
            <a href="#" title="Add Company"><i class="fa fa-building"></i></a>
            <a href="#" title="Edit Company"><i class="fa fa-pen"></i></a>
            <a href="#" title="Add User"><i class="fa fa-user-plus"></i></a>
            <a href="#" title="Edit User"><i class="fa fa-user-edit"></i></a>
        </div>
        </div>
      `;
      document.body.appendChild(div);

      document.querySelectorAll('py-script').forEach((elem: PyScript, i) => {
            var code = elem.innerHTML;
            elem.innerHTML = "";
            elem.code = code;
            elem.cm = CodeMirror(elem, {
                lineNumbers: true,
                tabSize: 2,
                value: code,
                mode: 'python'
            });
            
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
                var code = elem.cm.getValue();
                let pyodide = await pyodideReadyPromise;
                try {
                let output = pyodide.runPython(code);
                addToOutput(output);
                } catch (err) {
                addToOutput(err);
                }
            }
            
            
      });
    }
    
    window.onload= create_menu;

    async function main() {
        let pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.19.0/full/",
        });
    
        return pyodide;
      }
    let pyodideReadyPromise = main();

    async function evaluatePython() {
        let pyodide = await pyodideReadyPromise;
        try {
        let output = pyodide.runPython(code.value);
        addToOutput(output);
        } catch (err) {
        addToOutput(err);
        }
    }
    

