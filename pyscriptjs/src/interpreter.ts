// @ts-nocheck
// @ts-ignore
let pyodideReadyPromise;


let additional_definitions = `
from js import document, setInterval, console
import asyncio
import io, base64

loop = asyncio.get_event_loop()

class PyScript:
    loop = loop

    @staticmethod
    def write(element_id, value, append=False, exec_id=0):
        """Writes value to the element with id "element_id"""
        console.log(f"APPENDING: {append} ==> {element_id} --> {value}")
        if append:
            child = document.createElement('div');
            element = document.querySelector(f'#{element_id}');
            exec_id = exec_id or element.childElementCount + 1
            element_id = child.id = f"{element_id}-{exec_id}";
            element.appendChild(child);

        if hasattr(value, "savefig"):
            console.log(f"FIGURE: {value}")
            buf = io.BytesIO()
            value.savefig(buf, format='png')
            buf.seek(0)
            img_str = 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')
            document.getElementById(element_id).innerHTML = f'<div><img id="plt" src="{img_str}"/></div>'
        elif hasattr(value, "startswith") and value.startswith("data:image"):
            console.log(f"DATA/IMAGE: {value}")
            document.getElementById(element_id).innerHTML = f'<div><img id="plt" src="{value}"/></div>'
        else:
            document.getElementById(element_id).innerHTML = repr(value);
            console.log(f"ELSE: {append} ==> {element_id} --> {value}")

    @staticmethod
    def run_until_complete(f):
        p = loop.run_until_complete(f)

pyscript = PyScript()



class Element:
    def __init__(self, element_id):
        self._id = element_id

    @property
    def element(self):
        """Return the dom element"""
        return document.querySelector(f'#{self._id}');

    def write(self, value, append=False):
        console.log(f"Element.write: {value} --> {append}")
        pyscript.write(self._id, value, append=append)

    def clear(self):
        self.write("", append=False)

    def clone(self, new_id=None):
        if new_id is None:
            new_id = self.element.id

        clone = self.element.cloneNode(true);
        clone.id = new_id;

        # Inject it into the DOM
        self.element.after(clone);

`

let loadInterpreter = async function(): any {
    /* @ts-ignore */
    let pyodide = await loadPyodide({ 
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.19.0/full/",
        }); 

    // now that we loaded, add additional convenience fuctions
    pyodide.loadPackage(['matplotlib', 'numpy'])

    await pyodide.loadPackage("micropip");
    await pyodide.runPythonAsync(`
    import micropip
    await micropip.install("ipython")
    `);

    let output = pyodide.runPython(additional_definitions);

    /* @ts-ignore */
    return pyodide;
}

export {loadInterpreter, pyodideReadyPromise}