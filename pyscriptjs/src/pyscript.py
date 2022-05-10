import asyncio
import base64
import io
import sys
import time
from textwrap import dedent

import micropip  # noqa: F401
from js import console, document

loop = asyncio.get_event_loop()

MIME_METHODS = {
    "__repr__": "text/plain",
    "_repr_html_": "text/html",
    "_repr_markdown_": "text/markdown",
    "_repr_svg_": "image/svg+xml",
    "_repr_png_": "image/png",
    "_repr_pdf_": "application/pdf",
    "_repr_jpeg_": "image/jpeg",
    "_repr_latex": "text/latex",
    "_repr_json_": "application/json",
    "_repr_javascript_": "application/javascript",
    "savefig": "image/png",
}


def render_image(mime, value, meta):
    data = f"data:{mime};charset=utf-8;base64,{value}"
    attrs = " ".join(['{k}="{v}"' for k, v in meta.items()])
    return f'<img src="{data}" {attrs}</img>'


def identity(value, meta):
    return value


MIME_RENDERERS = {
    "text/plain": identity,
    "text/html": identity,
    "image/png": lambda value, meta: render_image("image/png", value, meta),
    "image/jpeg": lambda value, meta: render_image("image/jpeg", value, meta),
    "image/svg+xml": identity,
    "application/json": identity,
    "application/javascript": lambda value, meta: f"<script>{value}</script>",
}


def eval_formatter(obj, print_method):
    """
    Evaluates a formatter method.
    """
    if print_method == "__repr__":
        return repr(obj)
    elif hasattr(obj, print_method):
        if print_method == "savefig":
            buf = io.BytesIO()
            obj.savefig(buf, format="png")
            buf.seek(0)
            return base64.b64encode(buf.read()).decode("utf-8")
        return getattr(obj, print_method)()
    elif print_method == "_repr_mimebundle_":
        return {}, {}
    return None


def format_mime(obj):
    """
    Formats object using _repr_x_ methods.
    """
    if isinstance(obj, str):
        return obj, "text/plain"

    mimebundle = eval_formatter(obj, "_repr_mimebundle_")
    if isinstance(mimebundle, tuple):
        format_dict, _ = mimebundle
    else:
        format_dict = mimebundle

    output, not_available = None, []
    for method, mime_type in reversed(MIME_METHODS.items()):
        if mime_type in format_dict:
            output = format_dict[mime_type]
        else:
            output = eval_formatter(obj, method)

        if output is None:
            continue
        elif mime_type not in MIME_RENDERERS:
            not_available.append(mime_type)
            continue
        break
    if output is None:
        if not_available:
            console.warning(
                f"Rendered object requested unavailable MIME renderers: {not_available}"
            )
        output = repr(output)
        mime_type = "text/plain"
    elif isinstance(output, tuple):
        output, meta = output
    else:
        meta = {}
    return MIME_RENDERERS[mime_type](output, meta), mime_type


class PyScript:
    loop = loop

    @staticmethod
    def write(element_id, value, append=False, exec_id=0):
        """Writes value to the element with id "element_id"""
        console.log(f"APPENDING: {append} ==> {element_id} --> {value}")
        if append:
            child = document.createElement("div")
            element = document.querySelector(f"#{element_id}")
            if not element:
                return
            exec_id = exec_id or element.childElementCount + 1
            element_id = child.id = f"{element_id}-{exec_id}"
            element.appendChild(child)

        element = document.getElementById(element_id)
        html, mime_type = format_mime(value)
        if mime_type in ("application/javascript", "text/html"):
            script_element = document.createRange().createContextualFragment(html)
            element.appendChild(script_element)
        else:
            element.innerHTML = html

    @staticmethod
    def run_until_complete(f):
        _ = loop.run_until_complete(f)


class Element:
    def __init__(self, element_id, element=None):
        self._id = element_id
        self._element = element

    @property
    def id(self):
        return self._id

    @property
    def element(self):
        """Return the dom element"""
        if not self._element:
            self._element = document.querySelector(f"#{self._id}")
        return self._element

    @property
    def value(self):
        return self.element.value

    @property
    def innerHtml(self):
        return self.element.innerHtml

    def write(self, value, append=False):
        console.log(f"Element.write: {value} --> {append}")
        # TODO: it should be the opposite... pyscript.write should use the Element.write
        #       so we can consolidate on how we write depending on the element type
        pyscript.write(self._id, value, append=append)

    def clear(self):
        if hasattr(self.element, "value"):
            self.element.value = ""
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

        clone = self.element.cloneNode(True)
        clone.id = new_id

        if to:
            to.element.appendChild(clone)

        # Inject it into the DOM
        self.element.after(clone)

        return Element(clone.id, clone)

    def remove_class(self, classname):
        if isinstance(classname, list):
            for cl in classname:
                self.remove_class(cl)
        else:
            self.element.classList.remove(classname)

    def add_class(self, classname):
        self.element.classList.add(classname)


def add_classes(element, class_list):
    for klass in class_list.split(" "):
        element.classList.add(klass)


def create(what, id_=None, classes=""):
    element = document.createElement(what)
    if id_:
        element.id = id_
    add_classes(element, classes)
    return Element(id_, element)


class PyWidgetTheme:
    def __init__(self, main_style_classes):
        self.main_style_classes = main_style_classes

    def theme_it(self, widget):
        for klass in self.main_style_classes.split(" "):
            widget.classList.add(klass)


class PyItemTemplate(Element):
    label_fields = None

    def __init__(self, data, labels=None, state_key=None, parent=None):
        self.data = data

        self.register_parent(parent)

        if not labels:
            labels = list(self.data.keys())
        self.labels = labels

        self.state_key = state_key

        super().__init__(self._id)

    def register_parent(self, parent):
        self._parent = parent
        if parent:
            self._id = f"{self._parent._id}-c-{len(self._parent._children)}"
            self.data["id"] = self._id
        else:
            self._id = None

    def create(self):
        console.log("creating section")
        new_child = create("section", self._id, "task bg-white my-1")
        console.log("creating values")

        console.log("creating innerHtml")
        new_child._element.innerHTML = dedent(
            f"""
            <label for="flex items-center p-2 ">
              <input class="mr-2" type="checkbox" class="task-check">
              <p class="m-0 inline">{self.render_content()}</p>
            </label>
            """
        )

        console.log("returning")
        return new_child

    def on_click(self, evt):
        pass

    def pre_append(self):
        pass

    def post_append(self):
        self.element.click = self.on_click
        self.element.onclick = self.on_click

        self._post_append()

    def _post_append(self):
        pass

    def strike(self, value, extra=None):
        if value:
            self.add_class("line-through")
        else:
            self.remove_class("line-through")

    def render_content(self):
        return " - ".join([self.data[f] for f in self.labels])


class PyListTemplate:
    theme = PyWidgetTheme("flex flex-col-reverse mt-8 mx-8")
    item_class = PyItemTemplate

    def __init__(self, parent):
        self.parent = parent
        self._children = []
        self._id = self.parent.id

    @property
    def children(self):
        return self._children

    @property
    def data(self):
        return [c.data for c in self._children]

    def render_children(self):
        binds = {}
        for i, c in enumerate(self._children):
            txt = c.element.innerHTML
            rnd = str(time.time()).replace(".", "")[-5:]
            new_id = f"{c.element.id}-{i}-{rnd}"
            binds[new_id] = c.element.id
            txt = txt.replace(">", f" id='{new_id}'>")
            print(txt)

        def foo(evt):
            console.log(evt)
            evtEl = evt.srcElement
            srcEl = Element(binds[evtEl.id])
            srcEl.element.onclick()
            evtEl.classList = srcEl.element.classList

        for new_id in binds:
            Element(new_id).element.onclick = foo

    def connect(self):
        self.md = main_div = document.createElement("div")
        main_div.id = self._id + "-list-tasks-container"

        if self.theme:
            self.theme.theme_it(main_div)

        self.parent.appendChild(main_div)

    def add(self, *args, **kws):
        if not isinstance(args[0], self.item_class):
            child = self.item_class(*args, **kws)
        else:
            child = args[0]
        child.register_parent(self)
        return self._add(child)

    def _add(self, child_elem):
        console.log("appending child", child_elem.element)
        self.pre_child_append(child_elem)
        child_elem.pre_append()
        self._children.append(child_elem)
        self.md.appendChild(child_elem.create().element)
        child_elem.post_append()
        self.child_appended(child_elem)
        return child_elem

    def pre_child_append(self, child):
        pass

    def child_appended(self, child):
        """Overwrite me to define logic"""
        pass


class OutputCtxManager:
    def __init__(self, out=None, output_to_console=True, append=True):
        self._out = out
        self._prev = out
        self.output_to_console = output_to_console
        self._append = append

    def change(self, out=None, err=None, output_to_console=True, append=True):
        self._prev = self._out
        self._out = out
        self.output_to_console = output_to_console
        self._append = append
        console.log("----> changed out to", self._out, self._append)

    def revert(self):
        console.log("----> reverted")
        self._out = self._prev

    def write(self, txt):
        console.log("writing to", self._out, txt, self._append)
        if self._out:
            pyscript.write(self._out, txt, append=self._append)
        if self.output_to_console:
            console.log(self._out, txt)


class OutputManager:
    def __init__(self, out=None, err=None, output_to_console=True, append=True):
        sys.stdout = self._out_manager = OutputCtxManager(
            out, output_to_console, append
        )
        sys.stderr = self._err_manager = OutputCtxManager(
            err, output_to_console, append
        )
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
        sys.stderr = self._err_manager
        console.log("----> reverted")


pyscript = PyScript()
output_manager = OutputManager()
