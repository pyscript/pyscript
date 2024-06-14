import inspect
import sys

try:
    from typing import Any
except ImportError:
    Any = "Any"

try:
    import warnings
except ImportError:
    # TODO: For now it probably means we are in MicroPython. We should figure
    # out the "right" way to handle this. For now we just ignore the warning
    # and logging to console
    class warnings:
        @staticmethod
        def warn(*args, **kwargs):
            print("WARNING: ", *args, **kwargs)


try:
    from functools import cached_property
except ImportError:
    # TODO: same comment about micropython as above
    cached_property = property

try:
    from pyodide.ffi import JsProxy
except ImportError:
    # TODO: same comment about micropython as above
    def JsProxy(obj):
        return obj


from pyscript import document, window

# from pyscript.web import dom as pydom

#: A flag to show if MicroPython is the current Python interpreter.
is_micropython = "MicroPython" in sys.version


def getmembers_static(cls):
    """Cross-interpreter implementation of inspect.getmembers_static."""

    if is_micropython:  # pragma: no cover
        return [(name, getattr(cls, name)) for name, _ in inspect.getmembers(cls)]

    return inspect.getmembers_static(cls)


class JSProperty:
    """JS property descriptor that directly maps to the property with the same
    name in the underlying JS component."""

    def __init__(self, name: str, allow_nones: bool = False):
        self.name = name
        self.allow_nones = allow_nones

    def __get__(self, obj, objtype=None):
        return getattr(obj._js, self.name)

    def __set__(self, obj, value):
        if not self.allow_nones and value is None:
            return
        setattr(obj._js, self.name, value)


# ------ TODO: REMOVE!!!! pydom elements


class BaseElement:
    def __init__(self, js_element):
        self._js = js_element
        self._parent = None
        self.style = StyleProxy(self)
        self._proxies = {}

    def __eq__(self, obj):
        """Check if the element is the same as the other element by comparing
        the underlying JS element"""
        return isinstance(obj, BaseElement) and obj._js == self._js

    @property
    def parent(self):
        if self._parent:
            return self._parent

        if self._js.parentElement:
            # TODO: This should actually return the correct class (== to tagName)
            self._parent = Element(self._js.parentElement)

        return self._parent

    # @property
    # def __class(self):
    #     return self.__class__ if self.__class__ != PyDom else Element

    def create(self, type_, is_child=True, classes=None, html=None, label=None):
        js_el = document.createElement(type_)
        element = self.__class(js_el)

        if classes:
            for class_ in classes:
                element.add_class(class_)

        if html is not None:
            element.html = html

        if label is not None:
            element.label = label

        if is_child:
            self.append(element)

        return element

    def find(self, selector):
        """Return an ElementCollection representing all the child elements that
        match the specified selector.

        Args:
            selector (str): A string containing a selector expression

        Returns:
            ElementCollection: A collection of elements matching the selector
        """
        elements = self._js.querySelectorAll(selector)
        if not elements:
            return None
        return ElementCollection([Element(el) for el in elements])


class Element(BaseElement):
    @property
    def children(self):
        return [self.__class__(el) for el in self._js.children]

    def append(self, child):
        # TODO: this is Pyodide specific for now!!!!!!
        # if we get passed a JSProxy Element directly we just map it to the
        # higher level Python element
        if inspect.isclass(JsProxy) and isinstance(child, JsProxy):
            return self.append(Element(child))

        elif isinstance(child, Element):
            self._js.appendChild(child._js)

            return child

        elif isinstance(child, ElementCollection):
            for el in child:
                self.append(el)

    # -------- Pythonic Interface to Element -------- #
    @property
    def html(self):
        return self._js.innerHTML

    @html.setter
    def html(self, value):
        self._js.innerHTML = value

    @property
    def text(self):
        return self._js.textContent

    @text.setter
    def text(self, value):
        self._js.textContent = value

    @property
    def content(self):
        # TODO: This breaks with with standard template elements. Define how to best
        #       handle this specifica use case. Just not support for now?
        if self._js.tagName == "TEMPLATE":
            warnings.warn(
                "Content attribute not supported for template elements.", stacklevel=2
            )
            return None
        return self._js.innerHTML

    @content.setter
    def content(self, value):
        # TODO: (same comment as above)
        if self._js.tagName == "TEMPLATE":
            warnings.warn(
                "Content attribute not supported for template elements.", stacklevel=2
            )
            return

        display(value, target=self.id)

    @property
    def id(self):
        return self._js.id

    @id.setter
    def id(self, value):
        self._js.id = value

    @property
    def options(self):
        if "options" in self._proxies:
            return self._proxies["options"]

        if not self._js.tagName.lower() in {"select", "datalist", "optgroup"}:
            raise AttributeError(
                f"Element {self._js.tagName} has no options attribute."
            )
        self._proxies["options"] = OptionsProxy(self)
        return self._proxies["options"]

    @property
    def value(self):
        return self._js.value

    @value.setter
    def value(self, value):
        # in order to avoid confusion to the user, we don't allow setting the
        # value of elements that don't have a value attribute
        if not hasattr(self._js, "value"):
            raise AttributeError(
                f"Element {self._js.tagName} has no value attribute. If you want to "
                "force a value attribute, set it directly using the `_js.value = <value>` "
                "javascript API attribute instead."
            )
        self._js.value = value

    @property
    def selected(self):
        return self._js.selected

    @selected.setter
    def selected(self, value):
        # in order to avoid confusion to the user, we don't allow setting the
        # value of elements that don't have a value attribute
        if not hasattr(self._js, "selected"):
            raise AttributeError(
                f"Element {self._js.tagName} has no value attribute. If you want to "
                "force a value attribute, set it directly using the `_js.value = <value>` "
                "javascript API attribute instead."
            )
        self._js.selected = value

    def clone(self, new_id=None):
        clone = Element(self._js.cloneNode(True))
        clone.id = new_id

        return clone

    def remove_class(self, classname):
        classList = self._js.classList
        if isinstance(classname, list):
            classList.remove(*classname)
        else:
            classList.remove(classname)
        return self

    def add_class(self, classname):
        classList = self._js.classList
        if isinstance(classname, list):
            classList.add(*classname)
        else:
            self._js.classList.add(classname)
        return self

    @property
    def classes(self):
        classes = self._js.classList.values()
        return [x for x in classes]

    def show_me(self):
        self._js.scrollIntoView()

    def snap(
        self,
        to: BaseElement | str = None,
        width: int | None = None,
        height: int | None = None,
    ):
        """
        Captures a snapshot of a video element. (Only available for video elements)

        Inputs:

            * to: element where to save the snapshot of the video frame to
            * width: width of the image
            * height: height of the image

        Output:
            (Element) canvas element where the video frame snapshot was drawn into
        """
        if self._js.tagName != "VIDEO":
            raise AttributeError("Snap method is only available for video Elements")

        if to is None:
            canvas = self.create("canvas")
            if width is None:
                width = self._js.width
            if height is None:
                height = self._js.height
            canvas._js.width = width
            canvas._js.height = height

        elif isinstance(to, Element):
            if to._js.tagName != "CANVAS":
                raise TypeError("Element to snap to must a canvas.")
            canvas = to
        elif getattr(to, "tagName", "") == "CANVAS":
            canvas = Element(to)
        elif isinstance(to, str):
            # TODO (fpliger): This needs a better fix but doing a local import here for a quick fix
            from pyscript.web import dom

            canvas = dom[to][0]
            if canvas._js.tagName != "CANVAS":
                raise TypeError("Element to snap to must a be canvas.")

        canvas.draw(self, width, height)

        return canvas

    def download(self, filename: str = "snapped.png") -> None:
        """Download the current element (only available for canvas elements) with the filename
        provided in input.

        Inputs:
            * filename (str): name of the file being downloaded

        Output:
            None
        """
        if self._js.tagName != "CANVAS":
            raise AttributeError(
                "The download method is only available for canvas Elements"
            )

        link = self.create("a")
        link._js.download = filename
        link._js.href = self._js.toDataURL()
        link._js.click()

    def draw(self, what, width, height):
        """Draw `what` on the current element  (only available for canvas elements).

        Inputs:

            * what (canvas image source): An element to draw into the context. The specification permits any canvas
                image source, specifically, an HTMLImageElement, an SVGImageElement, an HTMLVideoElement,
                an HTMLCanvasElement, an ImageBitmap, an OffscreenCanvas, or a VideoFrame.
        """
        if self._js.tagName != "CANVAS":
            raise AttributeError(
                "The draw method is only available for canvas Elements"
            )

        if isinstance(what, Element):
            what = what._js

        # https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        self._js.getContext("2d").drawImage(what, 0, 0, width, height)


class OptionsProxy:
    """This class represents the options of a select element. It
    allows to access to add and remove options by using the `add` and `remove` methods.
    """

    def __init__(self, element: Element) -> None:
        self._element = element
        if self._element._js.tagName.lower() != "select":
            raise AttributeError(
                f"Element {self._element._js.tagName} has no options attribute."
            )

    def add(
        self,
        value: Any = None,
        html: str = None,
        text: str = None,
        before: Element | int = None,
        **kws,
    ) -> None:
        """Add a new option to the select element"""
        # create the option element and set the attributes
        option = document.createElement("option")
        if value is not None:
            kws["value"] = value
        if html is not None:
            option.innerHTML = html
        if text is not None:
            kws["text"] = text

        for key, value in kws.items():
            option.setAttribute(key, value)

        if before:
            if isinstance(before, Element):
                before = before._js

        self._element._js.add(option, before)

    def remove(self, item: int) -> None:
        """Remove the option at the specified index"""
        self._element._js.remove(item)

    def clear(self) -> None:
        """Remove all the options"""
        for i in range(len(self)):
            self.remove(0)

    @property
    def options(self):
        """Return the list of options"""
        return [Element(opt) for opt in self._element._js.options]

    @property
    def selected(self):
        """Return the selected option"""
        return self.options[self._element._js.selectedIndex]

    def __iter__(self):
        yield from self.options

    def __len__(self):
        return len(self.options)

    def __repr__(self):
        return f"{self.__class__.__name__} (length: {len(self)}) {self.options}"

    def __getitem__(self, key):
        return self.options[key]


class StyleProxy:  # (dict):
    def __init__(self, element: Element) -> None:
        self._element = element

    @cached_property
    def _style(self):
        return self._element._js.style

    def __getitem__(self, key):
        return self._style.getPropertyValue(key)

    def __setitem__(self, key, value):
        self._style.setProperty(key, value)

    def remove(self, key):
        self._style.removeProperty(key)

    def set(self, **kws):
        for k, v in kws.items():
            self._element._js.style.setProperty(k, v)

    # CSS Properties
    # Reference: https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts#L3799C1-L5005C2
    # Following prperties automatically generated from the above reference using
    # tools/codegen_css_proxy.py
    @property
    def visible(self):
        return self._element._js.style.visibility

    @visible.setter
    def visible(self, value):
        self._element._js.style.visibility = value


# --------- END OF PYDOM STUFF ------


class ElementBase(Element):
    tag = "div"

    # GLOBAL ATTRIBUTES
    # These are attribute that all elements have (this list is a subset of the official one)
    # We are trying to capture the most used ones
    accesskey = JSProperty("accesskey")
    autofocus = JSProperty("autofocus")
    autocapitalize = JSProperty("autocapitalize")
    className = JSProperty("className")
    contenteditable = JSProperty("contenteditable")
    draggable = JSProperty("draggable")
    enterkeyhint = JSProperty("enterkeyhint")
    hidden = JSProperty("hidden")
    id = JSProperty("id")
    lang = JSProperty("lang")
    nonce = JSProperty("nonce")
    part = JSProperty("part")
    popover = JSProperty("popover")
    slot = JSProperty("slot")
    spellcheck = JSProperty("spellcheck")
    tabindex = JSProperty("tabindex")
    title = JSProperty("title")
    translate = JSProperty("translate")
    virtualkeyboardpolicy = JSProperty("virtualkeyboardpolicy")

    def __init__(self, style=None, **kwargs):
        super().__init__(document.createElement(self.tag))

        # set all the style properties provided in input
        if isinstance(style, dict):
            for key, value in style.items():
                self.style[key] = value
        elif style is None:
            pass
        else:
            raise ValueError(
                f"Style should be a dictionary, received {style} (type {type(style)}) instead."
            )

        # IMPORTANT!!! This is used to auto-harvest all input arguments and set them as properties
        self._init_properties(**kwargs)

    def _init_properties(self, **kwargs):
        """Set all the properties (of type JSProperties) provided in input as properties
        of the class instance.

        Args:
            **kwargs: The properties to set
        """
        # Look at all the properties of the class and see if they were provided in kwargs
        for attr_name, attr in getmembers_static(self.__class__):
            # For each one, actually check if it is a property of the class and set it
            if isinstance(attr, JSProperty) and attr_name in kwargs:
                try:
                    setattr(self, attr_name, kwargs[attr_name])
                except Exception as e:
                    print(f"Error setting {attr_name} to {kwargs[attr_name]}: {e}")
                    raise


class TextElementBase(ElementBase):
    def __init__(self, content=None, style=None, **kwargs):
        super().__init__(style=style, **kwargs)

        # If it's an element, append the element
        if isinstance(content, Element):
            self.append(content)
        # If it's a list of elements
        elif isinstance(content, list):
            for item in content:
                self.append(item)
        # If the content wasn't set just ignore
        elif content is None:
            pass
        else:
            # Otherwise, set content as the html of the element
            self.html = content


# IMPORTANT: For all HTML components defined below, we are not mapping all
# available attributes, just the global and the most common ones.
# If you need to access a specific attribute, you can always use the `_js.<attribute>`
class a(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a"""

    tag = "a"

    download = JSProperty("download")
    href = JSProperty("href")
    referrerpolicy = JSProperty("referrerpolicy")
    rel = JSProperty("rel")
    target = JSProperty("target")
    type = JSProperty("type")


class abbr(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr"""

    tag = "abbr"


class address(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address"""

    tag = "address"


class area(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area"""

    tag = "area"

    alt = JSProperty("alt")
    coords = JSProperty("coords")
    download = JSProperty("download")
    href = JSProperty("href")
    ping = JSProperty("ping")
    referrerpolicy = JSProperty("referrerpolicy")
    rel = JSProperty("rel")
    shape = JSProperty("shape")
    target = JSProperty("target")


class article(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article"""

    tag = "article"


class aside(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside"""

    tag = "aside"


class audio(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio"""

    tag = "audio"

    autoplay = JSProperty("autoplay")
    controls = JSProperty("controls")
    controlslist = JSProperty("controlslist")
    crossorigin = JSProperty("crossorigin")
    disableremoteplayback = JSProperty("disableremoteplayback")
    loop = JSProperty("loop")
    muted = JSProperty("muted")
    preload = JSProperty("preload")
    src = JSProperty("src")


class b(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b"""

    tag = "b"


class blockquote(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote"""

    tag = "blockquote"

    cite = JSProperty("cite")


class br(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br"""

    tag = "br"


class button(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button"""

    tag = "button"

    autofocus = JSProperty("autofocus")
    disabled = JSProperty("disabled")
    form = JSProperty("form")
    formaction = JSProperty("formaction")
    formenctype = JSProperty("formenctype")
    formmethod = JSProperty("formmethod")
    formnovalidate = JSProperty("formnovalidate")
    formtarget = JSProperty("formtarget")
    name = JSProperty("name")
    type = JSProperty("type")
    value = JSProperty("value")


class canvas(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas"""

    tag = "canvas"

    height = JSProperty("height")
    width = JSProperty("width")


class caption(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption"""

    tag = "caption"


class cite(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite"""

    tag = "cite"


class code(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code"""

    tag = "code"


class data(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data"""

    tag = "data"

    value = JSProperty("value")


class datalist(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist"""

    tag = "datalist"


class dd(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd"""

    tag = "dd"


class del_(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del"""

    tag = "del"

    cite = JSProperty("cite")
    datetime = JSProperty("datetime")


class details(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details"""

    tag = "details"

    open = JSProperty("open")


class dialog(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog"""

    tag = "dialog"

    open = JSProperty("open")


class div(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div"""

    tag = "div"


class dl(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl"""

    tag = "dl"

    value = JSProperty("value")


class dt(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt"""

    tag = "dt"


class em(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em"""

    tag = "em"


class embed(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed"""

    tag = "embed"

    height = JSProperty("height")
    src = JSProperty("src")
    type = JSProperty("type")
    width = JSProperty("width")


class fieldset(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset"""

    tag = "fieldset"

    disabled = JSProperty("disabled")
    form = JSProperty("form")
    name = JSProperty("name")


class figcaption(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption"""

    tag = "figcaption"


class figure(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure"""

    tag = "figure"


class footer(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer"""

    tag = "footer"


class form(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form"""

    tag = "form"

    accept_charset = JSProperty("accept-charset")
    action = JSProperty("action")
    autocapitalize = JSProperty("autocapitalize")
    autocomplete = JSProperty("autocomplete")
    enctype = JSProperty("enctype")
    name = JSProperty("name")
    method = JSProperty("method")
    nonvalidate = JSProperty("nonvalidate")
    rel = JSProperty("rel")
    target = JSProperty("target")


class h1(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1"""

    tag = "h1"


class h2(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2"""

    tag = "h2"


class h3(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3"""

    tag = "h3"


class h4(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4"""

    tag = "h4"


class h5(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5"""

    tag = "h5"


class h6(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6"""

    tag = "h6"


class header(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header"""

    tag = "header"


class hgroup(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup"""

    tag = "hgroup"


class hr(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr"""

    tag = "hr"


class i(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i"""

    tag = "i"


class iframe(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe"""

    tag = "iframe"

    allow = JSProperty("allow")
    allowfullscreen = JSProperty("allowfullscreen")
    height = JSProperty("height")
    loading = JSProperty("loading")
    name = JSProperty("name")
    referrerpolicy = JSProperty("referrerpolicy")
    sandbox = JSProperty("sandbox")
    src = JSProperty("src")
    srcdoc = JSProperty("srcdoc")
    width = JSProperty("width")


class img(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img"""

    tag = "img"

    alt = JSProperty("alt")
    crossorigin = JSProperty("crossorigin")
    decoding = JSProperty("decoding")
    fetchpriority = JSProperty("fetchpriority")
    height = JSProperty("height")
    ismap = JSProperty("ismap")
    loading = JSProperty("loading")
    referrerpolicy = JSProperty("referrerpolicy")
    sizes = JSProperty("sizes")
    src = JSProperty("src")
    width = JSProperty("width")


# NOTE: Input is a reserved keyword in Python, so we use input_ instead
class input_(ElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input"""

    tag = "input"

    accept = JSProperty("accept")
    alt = JSProperty("alt")
    autofocus = JSProperty("autofocus")
    capture = JSProperty("capture")
    checked = JSProperty("checked")
    dirname = JSProperty("dirname")
    disabled = JSProperty("disabled")
    form = JSProperty("form")
    formaction = JSProperty("formaction")
    formenctype = JSProperty("formenctype")
    formmethod = JSProperty("formmethod")
    formnovalidate = JSProperty("formnovalidate")
    formtarget = JSProperty("formtarget")
    height = JSProperty("height")
    list = JSProperty("list")
    max = JSProperty("max")
    maxlength = JSProperty("maxlength")
    min = JSProperty("min")
    minlength = JSProperty("minlength")
    multiple = JSProperty("multiple")
    name = JSProperty("name")
    pattern = JSProperty("pattern")
    placeholder = JSProperty("placeholder")
    popovertarget = JSProperty("popovertarget")
    popovertargetaction = JSProperty("popovertargetaction")
    readonly = JSProperty("readonly")
    required = JSProperty("required")
    size = JSProperty("size")
    src = JSProperty("src")
    step = JSProperty("step")
    type = JSProperty("type")
    value = JSProperty("value")
    width = JSProperty("width")


class ins(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins"""

    tag = "ins"

    cite = JSProperty("cite")
    datetime = JSProperty("datetime")


class kbd(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd"""

    tag = "kbd"


class label(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label"""

    tag = "label"

    for_ = JSProperty("for")


class legend(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend"""

    tag = "legend"


class li(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li"""

    tag = "li"

    value = JSProperty("value")


class link(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link"""

    tag = "link"

    as_ = JSProperty("as")
    crossorigin = JSProperty("crossorigin")
    disabled = JSProperty("disabled")
    fetchpriority = JSProperty("fetchpriority")
    href = JSProperty("href")
    imagesizes = JSProperty("imagesizes")
    imagesrcset = JSProperty("imagesrcset")
    integrity = JSProperty("integrity")
    media = JSProperty("media")
    rel = JSProperty("rel")
    referrerpolicy = JSProperty("referrerpolicy")
    sizes = JSProperty("sizes")
    title = JSProperty("title")
    type = JSProperty("type")


class main(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main"""

    tag = "main"


class map_(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map"""

    tag = "map"

    name = JSProperty("name")


class mark(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark"""

    tag = "mark"


class menu(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu"""

    tag = "menu"


class meter(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter"""

    tag = "meter"

    form = JSProperty("form")
    high = JSProperty("high")
    low = JSProperty("low")
    max = JSProperty("max")
    min = JSProperty("min")
    optimum = JSProperty("optimum")
    value = JSProperty("value")


class nav(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav"""

    tag = "nav"


class object_(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object"""

    tag = "object"

    data = JSProperty("data")
    form = JSProperty("form")
    height = JSProperty("height")
    name = JSProperty("name")
    type = JSProperty("type")
    usemap = JSProperty("usemap")
    width = JSProperty("width")


class ol(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol"""

    tag = "ol"

    reversed = JSProperty("reversed")
    start = JSProperty("start")
    type = JSProperty("type")


class optgroup(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup"""

    tag = "optgroup"

    disabled = JSProperty("disabled")
    label = JSProperty("label")


class option(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option"""

    tag = "option"

    disabled = JSProperty("value")
    label = JSProperty("label")
    selected = JSProperty("selected")
    value = JSProperty("value")


class output(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output"""

    tag = "output"

    for_ = JSProperty("for")
    form = JSProperty("form")
    name = JSProperty("name")


class p(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p"""

    tag = "p"


class picture(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture"""

    tag = "picture"


class pre(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre"""

    tag = "pre"


class progress(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress"""

    tag = "progress"

    max = JSProperty("max")
    value = JSProperty("value")


class q(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q"""

    tag = "q"

    cite = JSProperty("cite")


class s(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s"""

    tag = "s"


class script(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script"""

    tag = "script"

    # Let's add async manually since it's a reserved keyword in Python
    async_ = JSProperty("async")
    blocking = JSProperty("blocking")
    crossorigin = JSProperty("crossorigin")
    defer = JSProperty("defer")
    fetchpriority = JSProperty("fetchpriority")
    integrity = JSProperty("integrity")
    nomodule = JSProperty("nomodule")
    nonce = JSProperty("nonce")
    referrerpolicy = JSProperty("referrerpolicy")
    src = JSProperty("src")
    type = JSProperty("type")


class section(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section"""

    tag = "section"


class select(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select"""

    tag = "select"


class small(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small"""

    tag = "small"


class source(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source"""

    tag = "source"

    media = JSProperty("media")
    sizes = JSProperty("sizes")
    src = JSProperty("src")
    srcset = JSProperty("srcset")
    type = JSProperty("type")


class span(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span"""

    tag = "span"


class strong(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong"""

    tag = "strong"


class style(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style"""

    tag = "style"

    blocking = JSProperty("blocking")
    media = JSProperty("media")
    nonce = JSProperty("nonce")
    title = JSProperty("title")


class sub(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub"""

    tag = "sub"


class summary(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary"""

    tag = "summary"


class sup(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup"""

    tag = "sup"


class table(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table"""

    tag = "table"


class tbody(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody"""

    tag = "tbody"


class td(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td"""

    tag = "td"

    colspan = JSProperty("colspan")
    headers = JSProperty("headers")
    rowspan = JSProperty("rowspan")


class template(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template"""

    tag = "template"

    shadowrootmode = JSProperty("shadowrootmode")


class textarea(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea"""

    tag = "textarea"

    autocapitalize = JSProperty("autocapitalize")
    autocomplete = JSProperty("autocomplete")
    autofocus = JSProperty("autofocus")
    cols = JSProperty("cols")
    dirname = JSProperty("dirname")
    disabled = JSProperty("disabled")
    form = JSProperty("form")
    maxlength = JSProperty("maxlength")
    minlength = JSProperty("minlength")
    name = JSProperty("name")
    placeholder = JSProperty("placeholder")
    readonly = JSProperty("readonly")
    required = JSProperty("required")
    rows = JSProperty("rows")
    spellcheck = JSProperty("spellcheck")
    wrap = JSProperty("wrap")


class tfoot(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot"""

    tag = "tfoot"


class th(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th"""

    tag = "th"


class thead(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead"""

    tag = "thead"


class time(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time"""

    tag = "time"

    datetime = JSProperty("datetime")


class title(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title"""

    tag = "title"


class tr(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr"""

    tag = "tr"

    abbr = JSProperty("abbr")
    colspan = JSProperty("colspan")
    headers = JSProperty("headers")
    rowspan = JSProperty("rowspan")
    scope = JSProperty("scope")


class track(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track"""

    tag = "track"

    default = JSProperty("default")
    kind = JSProperty("kind")
    label = JSProperty("label")
    src = JSProperty("src")
    srclang = JSProperty("srclang")


class u(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u"""

    tag = "u"


class ul(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul"""

    tag = "ul"


class var(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var"""

    tag = "var"


class video(TextElementBase):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video"""

    tag = "video"

    autoplay = JSProperty("autoplay")
    controls = JSProperty("controls")
    crossorigin = JSProperty("crossorigin")
    disablepictureinpicture = JSProperty("disablepictureinpicture")
    disableremoteplayback = JSProperty("disableremoteplayback")
    height = JSProperty("height")
    loop = JSProperty("loop")
    muted = JSProperty("muted")
    playsinline = JSProperty("playsinline")
    poster = JSProperty("poster")
    preload = JSProperty("preload")
    src = JSProperty("src")
    width = JSProperty("width")


# Custom Elements
class grid(TextElementBase):
    tag = "div"

    def __init__(self, layout, content=None, gap=None, **kwargs):
        super().__init__(content, **kwargs)
        self.style["display"] = "grid"
        self.style["grid-template-columns"] = layout

        # TODO: This should be a property
        if not gap is None:
            self.style["gap"] = gap


class StyleCollection:
    def __init__(self, collection: "ElementCollection") -> None:
        self._collection = collection

    def __get__(self, obj, objtype=None):
        return obj._get_attribute("style")

    def __getitem__(self, key):
        return self._collection._get_attribute("style")[key]

    def __setitem__(self, key, value):
        for element in self._collection._elements:
            element.style[key] = value

    def remove(self, key):
        for element in self._collection._elements:
            element.style.remove(key)


class ElementCollection:
    def __init__(self, elements: [Element]) -> None:
        self._elements = elements
        self.style = StyleCollection(self)

    def __getitem__(self, key):
        # If it's an integer we use it to access the elements in the collection
        if isinstance(key, int):
            return self._elements[key]
        # If it's a slice we use it to support slice operations over the elements
        # in the collection
        elif isinstance(key, slice):
            return ElementCollection(self._elements[key])

        # If it's anything else (basically a string) we use it as a selector
        # TODO: Write tests!
        elements = self._element.querySelectorAll(key)
        return ElementCollection([Element(el) for el in elements])

    def __len__(self):
        return len(self._elements)

    def __eq__(self, obj):
        """Check if the element is the same as the other element by comparing
        the underlying JS element"""
        return isinstance(obj, ElementCollection) and obj._elements == self._elements

    def _get_attribute(self, attr, index=None):
        if index is None:
            return [getattr(el, attr) for el in self._elements]

        # As JQuery, when getting an attr, only return it for the first element
        return getattr(self._elements[index], attr)

    def _set_attribute(self, attr, value):
        for el in self._elements:
            setattr(el, attr, value)

    @property
    def html(self):
        return self._get_attribute("html")

    @html.setter
    def html(self, value):
        self._set_attribute("html", value)

    @property
    def value(self):
        return self._get_attribute("value")

    @value.setter
    def value(self, value):
        self._set_attribute("value", value)

    @property
    def children(self):
        return self._elements

    def __iter__(self):
        yield from self._elements

    def __repr__(self):
        return f"{self.__class__.__name__} (length: {len(self._elements)}) {self._elements}"
