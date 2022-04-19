import { getLastPath } from "./utils";

// @ts-nocheck
// @ts-ignore
let pyodideReadyPromise;
let pyodide;

let additional_definitions = `
from js import document, setInterval, console
import micropip
import asyncio
import io, base64, sys

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
            if not element:
                return
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
            document.getElementById(element_id).innerHTML = f'<div><img id="plt" src="{value}"/></div>'
        else:
            document.getElementById(element_id).innerHTML = value;

    @staticmethod
    def run_until_complete(f):
        p = loop.run_until_complete(f)


class Element:
    def __init__(self, element_id, element=None):
        self._id = element_id
        self._element = element

    @property
    def element(self):
        """Return the dom element"""
        if not self._element:
            self._element = document.querySelector(f'#{self._id}');
        return self._element

    def write(self, value, append=False):
        console.log(f"Element.write: {value} --> {append}")
        # TODO: it should be the opposite... pyscript.write should use the Element.write
        #       so we can consolidate on how we write depending on the element type
        pyscript.write(self._id, value, append=append)

    def clear(self):
        if hasattr(self.element, 'value'):
            self.element.value = ''
        else:
            self.write("", append=False)

    def select(self, query, from_content=False):
        el = self.element
        if from_content:
            el = el.content

        _el = el.querySelector(query)
        if _el:
            return Element(_el.id, _el)
        else:
            console.log(f"WARNING: can't find element matching query {query}")

    def clone(self, new_id=None, to=None):
        if new_id is None:
            new_id = self.element.id

        clone = self.element.cloneNode(True);
        clone.id = new_id;

        if to:
            to.element.appendChild(clone)

        # Inject it into the DOM
        self.element.after(clone);
        
        return Element(clone.id, clone)

class OutputCtxManager:
    def __init__(self, out=None, output_to_console=True, append=True):
        self._out = out
        self._prev = out
        self.output_to_console = output_to_console
        self._append = append

    def change(self, out=None, err=None, output_to_console=True, append=True):
        self._prevt = self._out
        self._out = out
        self.output_to_console = output_to_console
        self._append = append
        console.log("----> changed out to", self._out, self._append)

    def revert(self):
        console.log("----> reverted")
        self._out = self._prev

    def write(self, txt):
        console.log('writing to', self._out, txt, self._append)
        if self._out:
            pyscript.write(self._out, txt, append=self._append)
        if self.output_to_console:
            console.log(self._out, txt)

class OutputManager:
    def __init__(self, out=None, err=None, output_to_console=True, append=True):
        sys.stdout = self._out_manager = OutputCtxManager(out, output_to_console, append)
        sys.strerr = self._err_manager = OutputCtxManager(err, output_to_console, append)
        self.output_to_console = output_to_console
        self._append = append

    def change(self, out=None, err=None, output_to_console=True, append=True):
        self._out_manager.change(out, output_to_console, append)
        sys.stdout = self._out_manager
        self._err_manager.change(err, output_to_console, append)
        sys.stderr = self._err_manager
        self.output_to_console = output_to_console
        self.append = append

    def revert(self):
        self._out_manager.revert()
        self._err_manager.revert()
        sys.stdout = self._out_manager
        sys.stdout = self._err_manager
        console.log("----> reverted")


pyscript = PyScript()
output_manager = OutputManager()

`

let loadInterpreter = async function(): Promise<any> {
    console.log("creating pyodide runtime");
    /* @ts-ignore */
    pyodide = await loadPyodide({
          stdout: console.log,
          stderr: console.log
        }); 

    // now that we loaded, add additional convenience fuctions
    console.log("loading micropip");
    await pyodide.loadPackage("micropip");
    console.log('loading pyscript module');
    // await pyodide.runPythonAsync(`
    //       from pyodide.http import pyfetch
    //       response = await pyfetch("/build/pyscript.py")
    //       with open("pyscript.py", "wb") as f:
    //           content = await response.bytes()
    //           print(content)
    //           f.write(content)
    //   `)
    // let pkg = pyodide.pyimport("pyscript");

    console.log("creating additional definitions");
    let output = pyodide.runPython(additional_definitions);
    console.log("done setting up environment");
    /* @ts-ignore */
    return pyodide;
}

let loadPackage = async function(package_name: string[] | string, runtime: any): Promise<any> {
    let micropip = pyodide.globals.get('micropip');
    await micropip.install(package_name)
    micropip.destroy()
}

let loadFromFile = async function(s: string, runtime: any): Promise<any> {
    let filename = getLastPath(s);
    await runtime.runPythonAsync(`
        from pyodide.http import pyfetch

        response = await pyfetch("`+s+`")
        content = await response.bytes()
        with open("`+filename+`", "wb") as f:
            f.write(content)
    `)

    runtime.pyimport(filename.replace(".py", ""));
}

export {loadInterpreter, pyodideReadyPromise, loadPackage, loadFromFile}
