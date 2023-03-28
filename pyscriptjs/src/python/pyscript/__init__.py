import ast
import asyncio
import base64
import html
import io
import re
import time
from collections import namedtuple
from contextlib import contextmanager
from textwrap import dedent

import js

try:
    from pyodide.code import eval_code
    from pyodide.ffi import create_proxy
except ImportError:
    from pyodide import create_proxy, eval_code


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
    # If the image value is using bytes we should convert it to base64
    # otherwise it will return raw bytes and the browser will not be able to
    # render it.
    if isinstance(value, bytes):
        value = base64.b64encode(value).decode("utf-8")

    # This is the pattern of base64 strings
    base64_pattern = re.compile(
        r"^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$"
    )
    # If value doesn't match the base64 pattern we should encode it to base64
    if len(value) > 0 and not base64_pattern.match(value):
        value = base64.b64encode(value.encode("utf-8")).decode("utf-8")

    data = f"data:{mime};charset=utf-8;base64,{value}"
    attrs = " ".join(['{k}="{v}"' for k, v in meta.items()])
    return f'<img src="{data}" {attrs}></img>'


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


# these are set by _set_version_info
__version__ = None
version_info = None


def _set_version_info(version_from_interpreter: str):
    """Sets the __version__ and version_info properties from provided JSON data
    Args:
        version_from_interpreter (str): A "dotted" representation of the version:
            YYYY.MM.m(m).releaselevel
            Year, Month, and Minor should be integers; releaselevel can be any string
    """
    global __version__
    global version_info

    __version__ = version_from_interpreter

    version_parts = version_from_interpreter.split(".")
    year = int(version_parts[0])
    month = int(version_parts[1])
    minor = int(version_parts[2])
    if len(version_parts) > 3:
        releaselevel = version_parts[3]
    else:
        releaselevel = ""

    VersionInfo = namedtuple("version_info", ("year", "month", "minor", "releaselevel"))
    version_info = VersionInfo(year, month, minor, releaselevel)

    # we ALSO set PyScript.__version__ and version_info for backwards
    # compatibility. Should be killed eventually.
    PyScript.__version__ = __version__
    PyScript.version_info = version_info


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
            js.console.warn(
                f"Rendered object requested unavailable MIME renderers: {not_available}"
            )
        output = repr(output)
        mime_type = "text/plain"
    elif isinstance(output, tuple):
        output, meta = output
    else:
        meta = {}
    return MIME_RENDERERS[mime_type](output, meta), mime_type


def run_until_complete(f):
    _ = loop.run_until_complete(f)


def write(element_id, value, append=False, exec_id=0):
    """Writes value to the element with id "element_id"""
    Element(element_id).write(value=value, append=append)
    js.console.warn(
        dedent(
            """PyScript Deprecation Warning: PyScript.write is
    marked as deprecated and will be removed sometime soon. Please, use
    Element(<id>).write instead."""
        )
    )


@contextmanager
def _display_target(target_id):
    get_current_display_target._id = target_id
    try:
        yield
    finally:
        get_current_display_target._id = None


def get_current_display_target():
    return get_current_display_target._id


get_current_display_target._id = None


def display(*values, target=None, append=True):
    if target is None:
        target = get_current_display_target()
    if target is None:
        raise Exception(
            "Implicit target not allowed here. Please use display(..., target=...)"
        )
    for v in values:
        Element(target).write(v, append=append)


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
            self._element = js.document.querySelector(f"#{self._id}")
        return self._element

    @property
    def value(self):
        return self.element.value

    @property
    def innerHtml(self):
        return self.element.innerHTML

    def write(self, value, append=False):
        html, mime_type = format_mime(value)
        if html == "\n":
            return

        if append:
            child = js.document.createElement("div")
            self.element.appendChild(child)

        if append and self.element.children:
            out_element = self.element.children[-1]
        else:
            out_element = self.element

        if mime_type in ("application/javascript", "text/html"):
            script_element = js.document.createRange().createContextualFragment(html)
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
            js.console.warn(f"WARNING: can't find element matching query {query}")

    def clone(self, new_id=None, to=None):
        if new_id is None:
            new_id = self.element.id

        clone = self.element.cloneNode(True)
        clone.id = new_id

        if to:
            to.element.appendChild(clone)
            # Inject it into the DOM
            to.element.after(clone)
        else:
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
        if isinstance(classname, list):
            for cl in classname:
                self.element.classList.add(cl)
        else:
            self.element.classList.add(classname)


def add_classes(element, class_list):
    for klass in class_list.split(" "):
        element.classList.add(klass)


def create(what, id_=None, classes=""):
    element = js.document.createElement(what)
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
        self.md = main_div = js.document.createElement("div")
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
        self._custom_elements = []
        self.app = None

    def init(self, app):
        self.app = app

    def configure(self, config):
        pass

    def afterSetup(self, interpreter):
        pass

    def afterStartup(self, interpreter):
        pass

    def beforePyScriptExec(self, interpreter, src, pyScriptTag):
        pass

    def afterPyScriptExec(self, interpreter, src, pyScriptTag, result):
        pass

    def beforePyReplExec(self, interpreter, src, outEl, pyReplTag):
        pass

    def afterPyReplExec(self, interpreter, src, outEl, pyReplTag, result):
        pass

    def onUserError(self, error):
        pass

    def register_custom_element(self, tag):
        """
        Decorator to register a new custom element as part of a Plugin and associate
        tag to it. Internally, it delegates the registration to the PyScript internal
        [JS] plugin manager, who actually creates the JS custom element that can be
        attached to the page and instantiate an instance of the class passing the custom
        element to the plugin constructor.

        Exammple:
        >> plugin = Plugin("PyTutorial")
        >> @plugin.register_custom_element("py-tutor")
        >> class PyTutor:
        >>     def __init__(self, element):
        >>     self.element = element
        """
        # TODO: Ideally would be better to use the logger.
        js.console.info(f"Defining new custom element {tag}")

        def wrapper(class_):
            # TODO: this is very pyodide specific but will have to do
            #       until we have JS interface that works across interpreters
            define_custom_element(tag, create_proxy(class_))  # noqa: F821

        self._custom_elements.append(tag)
        return create_proxy(wrapper)


class DeprecatedGlobal:
    """
    Proxy for globals which are deprecated.

    The intendend usage is as follows:

        # in the global namespace
        Element = pyscript.DeprecatedGlobal('Element', pyscript.Element, "...")
        console = pyscript.DeprecatedGlobal('console', js.console, "...")
        ...

    The proxy forwards __getattr__ and __call__ to the underlying object, and
    emit a warning on the first usage.

    This way users see a warning only if they actually access the top-level
    name.
    """

    def __init__(self, name, obj, message):
        self.__name = name
        self.__obj = obj
        self.__message = message
        self.__warning_already_shown = False

    def __repr__(self):
        return f"<DeprecatedGlobal({self.__name!r})>"

    def _show_warning(self, message):
        """
        NOTE: this is overridden by unit tests
        """
        # this showWarning is implemented in js and injected into this
        # namespace by main.ts
        showWarning(message, "html")  # noqa: F821

    def _show_warning_maybe(self):
        if self.__warning_already_shown:
            return
        self._show_warning(self.__message)
        self.__warning_already_shown = True

    def __getattr__(self, attr):
        self._show_warning_maybe()
        return getattr(self.__obj, attr)

    def __call__(self, *args, **kwargs):
        self._show_warning_maybe()
        return self.__obj(*args, **kwargs)

    def __iter__(self):
        self._show_warning_maybe()
        return iter(self.__obj)

    def __getitem__(self, key):
        self._show_warning_maybe()
        return self.__obj[key]

    def __setitem__(self, key, value):
        self._show_warning_maybe()
        self.__obj[key] = value


class PyScript:
    """
    This class is deprecated since 2022.12.1.

    All its old functionalities are available as module-level functions. This
    class should be killed eventually.
    """

    loop = loop

    @staticmethod
    def run_until_complete(f):
        run_until_complete(f)

    @staticmethod
    def write(element_id, value, append=False, exec_id=0):
        write(element_id, value, append, exec_id)


def _install_deprecated_globals_2022_12_1(ns):
    """
    Install into the given namespace all the globals which have been
    deprecated since the 2022.12.1 release. Eventually they should be killed.
    """

    def deprecate(name, obj, instead):
        message = f"Direct usage of <code>{name}</code> is deprecated. " + instead
        ns[name] = DeprecatedGlobal(name, obj, message)

    # function/classes defined in pyscript.py ===> pyscript.XXX
    pyscript_names = [
        "PyItemTemplate",
        "PyListTemplate",
        "PyWidgetTheme",
        "add_classes",
        "create",
        "loop",
    ]
    for name in pyscript_names:
        deprecate(
            name, globals()[name], f"Please use <code>pyscript.{name}</code> instead."
        )

    # stdlib modules ===> import XXX
    stdlib_names = [
        "asyncio",
        "base64",
        "io",
        "sys",
        "time",
        "datetime",
        "pyodide",
        "micropip",
    ]
    for name in stdlib_names:
        obj = __import__(name)
        deprecate(name, obj, f"Please use <code>import {name}</code> instead.")

    # special case
    deprecate(
        "dedent", dedent, "Please use <code>from textwrap import dedent</code> instead."
    )

    # these are names that used to leak in the globals but they are just
    # implementation details. People should not use them.
    private_names = [
        "eval_formatter",
        "format_mime",
        "identity",
        "render_image",
        "MIME_RENDERERS",
        "MIME_METHODS",
    ]
    for name in private_names:
        obj = globals()[name]
        message = (
            f"<code>{name}</code> is deprecated. "
            "This is a private implementation detail of pyscript. "
            "You should not use it."
        )
        ns[name] = DeprecatedGlobal(name, obj, message)

    # these names are available as js.XXX
    for name in ["document", "console"]:
        obj = getattr(js, name)
        deprecate(name, obj, f"Please use <code>js.{name}</code> instead.")

    # PyScript is special, use a different message
    message = (
        "The <code>PyScript</code> object is deprecated. "
        "Please use <code>pyscript</code> instead."
    )
    ns["PyScript"] = DeprecatedGlobal("PyScript", PyScript, message)


def _run_pyscript(code, id=None):
    import __main__

    with _display_target(id):
        result = eval_code(code, globals=__main__.__dict__)
    # The output of `runPython` is wrapped inside an dict since a dict is not
    # thenable. This is so we do not accidentally `await` the result of theß
    # python execution, even if it's awaitable (Future, Task, etc.)
    return js.Object.new(result=result)
