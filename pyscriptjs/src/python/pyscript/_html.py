import time
from datetime import datetime as dt
from textwrap import dedent

import js

from . import _internal
from ._mime import format_mime as _format_mime


class HTML:
    """
    Wrap a string so that display() can render it as plain HTML
    """

    def __init__(self, html):
        self._html = html

    def _repr_html_(self):
        return self._html


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


def display(*values, target=None, append=True):
    if target is None:
        target = _internal.DISPLAY_TARGET
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
        html, mime_type = _format_mime(value)
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
    item_class = PyItemTemplate

    def __init__(self, parent):
        self.parent = parent
        self._children = []
        self._id = self.parent.id
        self.main_style_classes = "py-li-element"

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

        if self.main_style_classes:
            for klass in self.main_style_classes.split(" "):
                main_div.classList.add(klass)

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


class PyItem(PyItemTemplate):
    def on_click(self, evt=None):
        self.data["done"] = not self.data["done"]
        self.strike(self.data["done"])

        self.select("input").element.checked = self.data["done"]


class PyList(PyListTemplate):
    item_class = PyItem

    def add(self, item):
        if isinstance(item, str):
            item = {"content": item, "done": False, "created_at": dt.now()}

        super().add(item, labels=["content"], state_key="done")
