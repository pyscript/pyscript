import ast
import asyncio
import base64
import html
import io
import time
from collections import namedtuple
from textwrap import dedent

import micropip  # noqa: F401
from js import console, document
try:
    from pyodide import create_proxy
except ImportError:
    from pyodide.ffi import create_proxy

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
    "text/plain": html.escape,
    "text/html": identity,
    "image/png": lambda value, meta: render_image("image/png", value, meta),
    "image/jpeg": lambda value, meta: render_image("image/jpeg", value, meta),
    "image/svg+xml": identity,
    "application/json": identity,
    "application/javascript": lambda value, meta: f"<script>{value}</script>",
}


class HTML:
    """
    Wrap a string so that display() can render it as plain HTML
    """

    def __init__(self, html):
        self._html = html

    def _repr_html_(self):
        return self._html


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
        return html.escape(obj), "text/plain"

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
            console.warn(
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
    def run_until_complete(f):
        _ = loop.run_until_complete(f)

    @staticmethod
    def write(element_id, value, append=False, exec_id=0):
        """Writes value to the element with id "element_id"""
        Element(element_id).write(value=value, append=append)
        console.warn(
            dedent(
                """PyScript Deprecation Warning: PyScript.write is
        marked as deprecated and will be removed sometime soon. Please, use
        Element(<id>).write instead."""
            )
        )

    @classmethod
    def set_version_info(cls, version_from_runtime: str):
        """Sets the __version__ and version_info properties from provided JSON data
        Args:
            version_from_runtime (str): A "dotted" representation of the version:
                YYYY.MM.m(m).releaselevel
                Year, Month, and Minor should be integers; releaselevel can be any string
        """

        # __version__ is the same string from runtime.ts
        cls.__version__ = version_from_runtime

        # version_info is namedtuple: (year, month, minor, releaselevel)
        version_parts = version_from_runtime.split(".")
        version_dict = {
            "year": int(version_parts[0]),
            "month": int(version_parts[1]),
            "minor": int(version_parts[2]),
        }

        # If the version only has three parts (e.g. 2022.09.1), let the releaselevel be ""
        try:
            version_dict["releaselevel"] = version_parts[3]
        except IndexError:
            version_dict["releaselevel"] = ""

        # Format mimics sys.version_info
        _VersionInfo = namedtuple("version_info", version_dict.keys())
        cls.version_info = _VersionInfo(**version_dict)

        # tidy up class namespace
        del cls.set_version_info


def set_current_display_target(target_id):
    get_current_display_target._id = target_id


def get_current_display_target():
    return get_current_display_target._id


get_current_display_target._id = None


def display(*values, target=None, append=True):
    default_target = get_current_display_target()

    if default_target is None and target is None:
        raise Exception(
            "Implicit target not allowed here. Please use display(..., target=...)"
        )

    if target is not None:
        for v in values:
            Element(target).write(v, append=append)
    else:
        for v in values:
            Element(default_target).write(v, append=append)


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
        out_element_id = self.id

        html, mime_type = format_mime(value)
        if html == "\n":
            return

        if append:
            child = document.createElement("div")
            exec_id = self.element.childElementCount + 1
            out_element_id = child.id = f"{self.id}-{exec_id}"
            self.element.appendChild(child)

        out_element = document.querySelector(f"#{out_element_id}")

        if mime_type in ("application/javascript", "text/html"):
            script_element = document.createRange().createContextualFragment(html)
            out_element.appendChild(script_element)
        else:
            out_element.innerHTML = html

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
            console.warn(f"WARNING: can't find element matching query {query}")

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
        new_child = create("div", self._id, "py-li-element")
        new_child._element.innerHTML = dedent(
            f"""
            <label id="{self._id}" for="flex items-center p-2 ">
              <input class="mr-2" type="checkbox" class="task-check">
              <p>{self.render_content()}</p>
            </label>
            """
        )
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
    theme = PyWidgetTheme("py-li-element")
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


class TopLevelAsyncFinder(ast.NodeVisitor):
    def is_source_top_level_await(self, source):
        self.async_found = False
        node = ast.parse(source)
        self.generic_visit(node)
        return self.async_found

    def visit_Await(self, node):
        self.async_found = True

    def visit_AsyncFor(self, node):
        self.async_found = True

    def visit_AsyncWith(self, node):
        self.async_found = True

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        pass  # Do not visit children of async function defs


def uses_top_level_await(source: str) -> bool:
    return TopLevelAsyncFinder().is_source_top_level_await(source)


class Plugin:
    def __init__(self, name=None):
        if not name:
            name = self.__class__.__name__

        self.name = name

    def init(self, app):
        self.app = app
        self.app.plugins.addPythonPlugin(create_proxy(self))

    def register_custom_element(self, tag):
        # TODO: Ideally would be better to use the logger.
        console.info(f"Defining new custom element {tag}")

        def wrapper(class_):
            # TODO: this is very pyodide specific but will have to do
            #       until we have JS interface that works across interpreters
            define_custom_element(tag, create_proxy(class_))  # noqa: F821

        return create_proxy(wrapper)


pyscript = PyScript()
