// ⚠️ This file is an artifact: DO NOT MODIFY
export default {
  "_pyscript": {
    "__init__.py": "import js as window\n\nIS_WORKER = not hasattr(window, \"document\")\n\nif IS_WORKER:\n    from polyscript import xworker as _xworker\n\n    window = _xworker.window\n    document = window.document\n    sync = _xworker.sync\nelse:\n    document = window.document\n",
    "display.py": "import base64\nimport html\nimport io\nimport re\n\nfrom . import document, window\n\n_MIME_METHODS = {\n    \"__repr__\": \"text/plain\",\n    \"_repr_html_\": \"text/html\",\n    \"_repr_markdown_\": \"text/markdown\",\n    \"_repr_svg_\": \"image/svg+xml\",\n    \"_repr_png_\": \"image/png\",\n    \"_repr_pdf_\": \"application/pdf\",\n    \"_repr_jpeg_\": \"image/jpeg\",\n    \"_repr_latex\": \"text/latex\",\n    \"_repr_json_\": \"application/json\",\n    \"_repr_javascript_\": \"application/javascript\",\n    \"savefig\": \"image/png\",\n}\n\n\ndef _render_image(mime, value, meta):\n    # If the image value is using bytes we should convert it to base64\n    # otherwise it will return raw bytes and the browser will not be able to\n    # render it.\n    if isinstance(value, bytes):\n        value = base64.b64encode(value).decode(\"utf-8\")\n\n    # This is the pattern of base64 strings\n    base64_pattern = re.compile(\n        r\"^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$\"\n    )\n    # If value doesn't match the base64 pattern we should encode it to base64\n    if len(value) > 0 and not base64_pattern.match(value):\n        value = base64.b64encode(value.encode(\"utf-8\")).decode(\"utf-8\")\n\n    data = f\"data:{mime};charset=utf-8;base64,{value}\"\n    attrs = \" \".join(['{k}=\"{v}\"' for k, v in meta.items()])\n    return f'<img src=\"{data}\" {attrs}></img>'\n\n\ndef _identity(value, meta):\n    return value\n\n\n_MIME_RENDERERS = {\n    \"text/plain\": html.escape,\n    \"text/html\": _identity,\n    \"image/png\": lambda value, meta: _render_image(\"image/png\", value, meta),\n    \"image/jpeg\": lambda value, meta: _render_image(\"image/jpeg\", value, meta),\n    \"image/svg+xml\": _identity,\n    \"application/json\": _identity,\n    \"application/javascript\": lambda value, meta: f\"<script>{value}<\\\\/script>\",\n}\n\n\nclass HTML:\n    \"\"\"\n    Wrap a string so that display() can render it as plain HTML\n    \"\"\"\n\n    def __init__(self, html):\n        self._html = html\n\n    def _repr_html_(self):\n        return self._html\n\n\ndef _eval_formatter(obj, print_method):\n    \"\"\"\n    Evaluates a formatter method.\n    \"\"\"\n    if print_method == \"__repr__\":\n        return repr(obj)\n    elif hasattr(obj, print_method):\n        if print_method == \"savefig\":\n            buf = io.BytesIO()\n            obj.savefig(buf, format=\"png\")\n            buf.seek(0)\n            return base64.b64encode(buf.read()).decode(\"utf-8\")\n        return getattr(obj, print_method)()\n    elif print_method == \"_repr_mimebundle_\":\n        return {}, {}\n    return None\n\n\ndef _format_mime(obj):\n    \"\"\"\n    Formats object using _repr_x_ methods.\n    \"\"\"\n    if isinstance(obj, str):\n        return html.escape(obj), \"text/plain\"\n\n    mimebundle = _eval_formatter(obj, \"_repr_mimebundle_\")\n    if isinstance(mimebundle, tuple):\n        format_dict, _ = mimebundle\n    else:\n        format_dict = mimebundle\n\n    output, not_available = None, []\n    for method, mime_type in reversed(_MIME_METHODS.items()):\n        if mime_type in format_dict:\n            output = format_dict[mime_type]\n        else:\n            output = _eval_formatter(obj, method)\n\n        if output is None:\n            continue\n        elif mime_type not in _MIME_RENDERERS:\n            not_available.append(mime_type)\n            continue\n        break\n    if output is None:\n        if not_available:\n            window.console.warn(\n                f\"Rendered object requested unavailable MIME renderers: {not_available}\"\n            )\n        output = repr(output)\n        mime_type = \"text/plain\"\n    elif isinstance(output, tuple):\n        output, meta = output\n    else:\n        meta = {}\n    return _MIME_RENDERERS[mime_type](output, meta), mime_type\n\n\ndef _write(element, value, append=False):\n    html, mime_type = _format_mime(value)\n    if html == \"\\\\n\":\n        return\n\n    if append:\n        out_element = document.createElement(\"div\")\n        element.append(out_element)\n    else:\n        out_element = element.lastElementChild\n        if out_element is None:\n            out_element = element\n\n    if mime_type in (\"application/javascript\", \"text/html\"):\n        script_element = document.createRange().createContextualFragment(html)\n        out_element.append(script_element)\n    else:\n        out_element.innerHTML = html\n\n\ndef display(*values, target=None, append=True):\n    element = document.getElementById(target)\n    for v in values:\n        _write(element, v, append=append)\n",
    "event_handling.py": "import inspect\n\nfrom pyodide.ffi.wrappers import add_event_listener\nfrom pyscript import document\n\n\ndef when(event_type=None, selector=None):\n    \"\"\"\n    Decorates a function and passes py-* events to the decorated function\n    The events might or not be an argument of the decorated function\n    \"\"\"\n\n    def decorator(func):\n        if isinstance(selector, str):\n            elements = document.querySelectorAll(selector)\n        else:\n            # TODO: This is a hack that will be removed when pyscript becomes a package\n            #       and we can better manage the imports without circular dependencies\n            from pyweb import pydom\n\n            if isinstance(selector, pydom.Element):\n                elements = [selector._js]\n            elif isinstance(selector, pydom.ElementCollection):\n                elements = [el._js for el in selector]\n            else:\n                raise ValueError(\n                    f\"Invalid selector: {selector}. Selector must\"\n                    \" be a string, a pydom.Element or a pydom.ElementCollection.\"\n                )\n\n        sig = inspect.signature(func)\n        # Function doesn't receive events\n        if not sig.parameters:\n\n            def wrapper(*args, **kwargs):\n                func()\n\n            for el in elements:\n                add_event_listener(el, event_type, wrapper)\n        else:\n            for el in elements:\n                add_event_listener(el, event_type, func)\n        return func\n\n    return decorator\n"
  },
  "pyscript.py": "# export only what we want to expose as `pyscript` module\n# but not what is WORKER/MAIN dependent\nfrom _pyscript import window, document, IS_WORKER\nfrom _pyscript.display import HTML, display as _display\nfrom _pyscript.event_handling import when\n\n# this part is needed to disambiguate between MAIN and WORKER\nif IS_WORKER:\n    # in workers the display does not have a default ID\n    # but there is a sync utility from xworker\n    import polyscript as _polyscript\n    from _pyscript import sync\n\n    def current_target():\n        return _polyscript.target\n\nelse:\n    # in MAIN both PyWorker and current element target exist\n    # so these are both exposed and the display will use,\n    # if not specified otherwise, such current element target\n    import _pyscript_js\n\n    PyWorker = _pyscript_js.PyWorker\n\n    def current_target():\n        return _pyscript_js.target\n\n\n# the display provides a handy default target either in MAIN or WORKER\ndef display(*values, target=None, append=True):\n    if target is None:\n        target = current_target()\n\n    return _display(*values, target=target, append=append)\n",
  "pyweb": {
    "pydom.py": "import sys\nimport warnings\nfrom functools import cached_property\nfrom typing import Any\n\nfrom pyodide.ffi import JsProxy\nfrom pyscript import display, document, window\n\n# from pyscript import when as _when\n\nalert = window.alert\n\n\nclass BaseElement:\n    def __init__(self, js_element):\n        self._js = js_element\n        self._parent = None\n        self.style = StyleProxy(self)\n\n    def __eq__(self, obj):\n        \"\"\"Check if the element is the same as the other element by comparing\n        the underlying JS element\"\"\"\n        return isinstance(obj, BaseElement) and obj._js == self._js\n\n    @property\n    def parent(self):\n        if self._parent:\n            return self._parent\n\n        if self._js.parentElement:\n            self._parent = self.__class__(self._js.parentElement)\n\n        return self._parent\n\n    @property\n    def __class(self):\n        return self.__class__ if self.__class__ != PyDom else Element\n\n    def create(self, type_, is_child=True, classes=None, html=None, label=None):\n        js_el = document.createElement(type_)\n        element = self.__class(js_el)\n\n        if classes:\n            for class_ in classes:\n                element.add_class(class_)\n\n        if html is not None:\n            element.html = html\n\n        if label is not None:\n            element.label = label\n\n        if is_child:\n            self.append(element)\n\n        return element\n\n    def find(self, selector):\n        \"\"\"Return an ElementCollection representing all the child elements that\n        match the specified selector.\n\n        Args:\n            selector (str): A string containing a selector expression\n\n        Returns:\n            ElementCollection: A collection of elements matching the selector\n        \"\"\"\n        elements = self._js.querySelectorAll(selector)\n        if not elements:\n            return None\n        return ElementCollection([Element(el) for el in elements])\n\n\nclass Element(BaseElement):\n    @property\n    def children(self):\n        return [self.__class__(el) for el in self._js.children]\n\n    def append(self, child):\n        # TODO: this is Pyodide specific for now!!!!!!\n        # if we get passed a JSProxy Element directly we just map it to the\n        # higher level Python element\n        if isinstance(child, JsProxy):\n            return self.append(Element(child))\n\n        elif isinstance(child, Element):\n            self._js.appendChild(child._js)\n\n            return child\n\n        elif isinstance(child, ElementCollection):\n            for el in child:\n                self.append(el)\n\n    # -------- Pythonic Interface to Element -------- #\n    @property\n    def html(self):\n        return self._js.innerHTML\n\n    @html.setter\n    def html(self, value):\n        self._js.innerHTML = value\n\n    @property\n    def content(self):\n        # TODO: This breaks with with standard template elements. Define how to best\n        #       handle this specifica use case. Just not support for now?\n        if self._js.tagName == \"TEMPLATE\":\n            warnings.warn(\n                \"Content attribute not supported for template elements.\", stacklevel=2\n            )\n            return None\n        return self._js.innerHTML\n\n    @content.setter\n    def content(self, value):\n        # TODO: (same comment as above)\n        if self._js.tagName == \"TEMPLATE\":\n            warnings.warn(\n                \"Content attribute not supported for template elements.\", stacklevel=2\n            )\n            return\n\n        display(value, target=self.id)\n\n    @property\n    def id(self):\n        return self._js.id\n\n    @id.setter\n    def id(self, value):\n        self._js.id = value\n\n    def clone(self, new_id=None):\n        clone = Element(self._js.cloneNode(True))\n        clone.id = new_id\n\n        return clone\n\n    def remove_class(self, classname):\n        classList = self._js.classList\n        if isinstance(classname, list):\n            classList.remove(*classname)\n        else:\n            classList.remove(classname)\n        return self\n\n    def add_class(self, classname):\n        classList = self._js.classList\n        if isinstance(classname, list):\n            classList.add(*classname)\n        else:\n            self._js.classList.add(classname)\n        return self\n\n    @property\n    def classes(self):\n        classes = self._js.classList.values()\n        return [x for x in classes]\n\n    def show_me(self):\n        self._js.scrollIntoView()\n\n    def when(self, event, handler):\n        document.when(event, selector=self)(handler)\n\n\nclass StyleProxy(dict):\n    def __init__(self, element: Element) -> None:\n        self._element = element\n\n    @cached_property\n    def _style(self):\n        return self._element._js.style\n\n    def __getitem__(self, key):\n        return self._style.getPropertyValue(key)\n\n    def __setitem__(self, key, value):\n        self._style.setProperty(key, value)\n\n    def remove(self, key):\n        self._style.removeProperty(key)\n\n    def set(self, **kws):\n        for k, v in kws.items():\n            self._element._js.style.setProperty(k, v)\n\n    # CSS Properties\n    # Reference: https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts#L3799C1-L5005C2\n    # Following prperties automatically generated from the above reference using\n    # tools/codegen_css_proxy.py\n    @property\n    def visible(self):\n        return self._element._js.style.visibility\n\n    @visible.setter\n    def visible(self, value):\n        self._element._js.style.visibility = value\n\n\nclass StyleCollection:\n    def __init__(self, collection: \"ElementCollection\") -> None:\n        self._collection = collection\n\n    def __get__(self, obj, objtype=None):\n        return obj._get_attribute(\"style\")\n\n    def __getitem__(self, key):\n        return self._collection._get_attribute(\"style\")[key]\n\n    def __setitem__(self, key, value):\n        for element in self._collection._elements:\n            element.style[key] = value\n\n    def remove(self, key):\n        for element in self._collection._elements:\n            element.style.remove(key)\n\n\nclass ElementCollection:\n    def __init__(self, elements: [Element]) -> None:\n        self._elements = elements\n        self.style = StyleCollection(self)\n\n    def __getitem__(self, key):\n        # If it's an integer we use it to access the elements in the collection\n        if isinstance(key, int):\n            return self._elements[key]\n        # If it's a slice we use it to support slice operations over the elements\n        # in the collection\n        elif isinstance(key, slice):\n            return ElementCollection(self._elements[key])\n\n        # If it's anything else (basically a string) we use it as a selector\n        # TODO: Write tests!\n        elements = self._element.querySelectorAll(key)\n        return ElementCollection([Element(el) for el in elements])\n\n    def __len__(self):\n        return len(self._elements)\n\n    def __eq__(self, obj):\n        \"\"\"Check if the element is the same as the other element by comparing\n        the underlying JS element\"\"\"\n        return isinstance(obj, ElementCollection) and obj._elements == self._elements\n\n    def _get_attribute(self, attr, index=None):\n        if index is None:\n            return [getattr(el, attr) for el in self._elements]\n\n        # As JQuery, when getting an attr, only return it for the first element\n        return getattr(self._elements[index], attr)\n\n    def _set_attribute(self, attr, value):\n        for el in self._elements:\n            setattr(el, attr, value)\n\n    @property\n    def html(self):\n        return self._get_attribute(\"html\")\n\n    @html.setter\n    def html(self, value):\n        self._set_attribute(\"html\", value)\n\n    @property\n    def children(self):\n        return self._elements\n\n    def __iter__(self):\n        yield from self._elements\n\n    def __repr__(self):\n        return f\"{self.__class__.__name__} (length: {len(self._elements)}) {self._elements}\"\n\n\nclass DomScope:\n    def __getattr__(self, __name: str) -> Any:\n        element = document[f\"#{__name}\"]\n        if element:\n            return element[0]\n\n\nclass PyDom(BaseElement):\n    # Add objects we want to expose to the DOM namespace since this class instance is being\n    # remapped as \"the module\" itself\n    BaseElement = BaseElement\n    Element = Element\n    ElementCollection = ElementCollection\n\n    def __init__(self):\n        super().__init__(document)\n        self.ids = DomScope()\n        self.body = Element(document.body)\n        self.head = Element(document.head)\n\n    def create(self, type_, parent=None, classes=None, html=None):\n        return super().create(type_, is_child=False)\n\n    def __getitem__(self, key):\n        if isinstance(key, int):\n            indices = range(*key.indices(len(self.list)))\n            return [self.list[i] for i in indices]\n\n        elements = self._js.querySelectorAll(key)\n        if not elements:\n            return None\n        return ElementCollection([Element(el) for el in elements])\n\n\ndom = PyDom()\n\nsys.modules[__name__] = dom\n"
  }
};
