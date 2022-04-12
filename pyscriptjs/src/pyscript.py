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

pyscript = PyScript()