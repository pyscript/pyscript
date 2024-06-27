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

from pyscript import document


#: A flag to show if MicroPython is the current Python interpreter.
is_micropython = "MicroPython" in sys.version


def getmembers_static(cls):
    """Cross-interpreter implementation of inspect.getmembers_static."""

    if is_micropython:  # pragma: no cover
        return [(name, getattr(cls, name)) for name, _ in inspect.getmembers(cls)]

    return inspect.getmembers_static(cls)


class DOMProperty:
    """A descriptor representing a property on an Element`.

    This maps a property on an `Element` instance, to the property with the specified
    name on the element's underlying DOM element.
    """

    def __init__(self, name: str, allow_nones: bool = False):
        self.name = name
        self.allow_nones = allow_nones

    def __get__(self, obj, objtype=None):
        return getattr(obj._dom_element, self.name)

    def __set__(self, obj, value):
        if not self.allow_nones and value is None:
            return
        setattr(obj._dom_element, self.name, value)


def element_from_dom(dom_element):
    """Create an instance of the appropriate subclass of `Element` for a DOM element.

    If the DOM element was created via an `Element` (i.e. by us) it will have a data
    attribute named `data-pyscript-type` that contains the name of the subclass
    that created it. If the `data-pyscript-type` attribute *is* present we look up the
    subclass by name and create an instance of that. Otherwise, we make a 'best-guess'
    and look up the `Element` subclass by tag name (this is NOT fool-proof as many
    subclasses might use a `<div>`, but close enough for jazz).
    """

    # We use "getAttribute" here instead of `js_element.dataset.pyscriptType` as the
    # latter throws an `AttributeError` if the value isn't set. This way we just get
    # `None` which seems cleaner.
    cls_name = dom_element.getAttribute("data-pyscript-type")
    if cls_name:
        cls = ELEMENT_CLASSES_BY_NAME.get(cls_name.lower())
    else:
        cls = ELEMENT_CLASSES_BY_TAG.get(dom_element.tagName.lower())

    # For any unknown elements (custom tags etc.) we just create an instance of the
    # 'Element' class.
    #
    # TODO: Should we have a subclass for unknown elements?
    if not cls:
        cls = Element

    return cls(dom_element=dom_element)


class Element:
    tag = "div"

    # GLOBAL ATTRIBUTES.
    # These are attribute that all elements have (this list is a subset of the official
    # one). We are trying to capture the most used ones.
    accesskey = DOMProperty("accesskey")
    autofocus = DOMProperty("autofocus")
    autocapitalize = DOMProperty("autocapitalize")
    className = DOMProperty("className")
    contenteditable = DOMProperty("contenteditable")
    draggable = DOMProperty("draggable")
    enterkeyhint = DOMProperty("enterkeyhint")
    hidden = DOMProperty("hidden")
    html = DOMProperty("innerHTML")
    id = DOMProperty("id")
    lang = DOMProperty("lang")
    nonce = DOMProperty("nonce")
    part = DOMProperty("part")
    popover = DOMProperty("popover")
    slot = DOMProperty("slot")
    spellcheck = DOMProperty("spellcheck")
    tabindex = DOMProperty("tabindex")
    text = DOMProperty("textContent")
    title = DOMProperty("title")
    translate = DOMProperty("translate")
    virtualkeyboardpolicy = DOMProperty("virtualkeyboardpolicy")

    def __init__(self, dom_element=None, style=None, classes=None, **kwargs):
        """
        If `js_element` is NOT None it means we are being called to *wrap* an
        existing js element. Otherwise, it means we are being called to *create* a new
        element.
        """

        self._dom_element = dom_element or document.createElement(self.tag)

        self._classes = Classes(self)
        self._parent = None
        self._style = Style(self)

        if dom_element is None:
            # Set any style properties provided in input.
            if isinstance(style, dict):
                self.style.set(**style)

            elif style is not None:
                raise ValueError(
                    f"Style should be a dictionary, received {style} (type {type(style)}) instead."
                )

            if classes:
                self.classes.add(classes)

            self._init_properties(**kwargs)

        # Tag the DOM element with our class name.
        self._dom_element.dataset.pyscriptType = type(self).__name__

    def __eq__(self, obj):
        """Check for equality by comparing the underlying DOM element."""
        return isinstance(obj, Element) and obj._dom_element == self._dom_element

    def _init_properties(self, **kwargs):
        """Set all the properties (of type DOMProperty) provided in input as properties
        of the class instance.

        Args:
            **kwargs: The properties to set
        """
        # Look at all the properties of the class and see if they were provided in
        # kwargs.
        for attr_name, attr_value in getmembers_static(self.__class__):
            # For each one, actually check if it is a property of the class and set it.
            if attr_name in kwargs and isinstance(attr_value, DOMProperty):
                try:
                    setattr(self, attr_name, kwargs[attr_name])
                except Exception as e:
                    print(f"Error setting {attr_name} to {kwargs[attr_name]}: {e}")
                    raise

    @property
    def classes(self):
        return self._classes

    @property
    def content(self):
        # TODO: This breaks with with standard template elements. Define how to best
        #       handle this specific use case. Just not support for now?
        if self._dom_element.tagName == "TEMPLATE":
            warnings.warn(
                "Content attribute not supported for template elements.", stacklevel=2
            )
            return None
        return self._dom_element.innerHTML

    @content.setter
    def content(self, value):
        # TODO: (same comment as above)
        if self._dom_element.tagName == "TEMPLATE":
            warnings.warn(
                "Content attribute not supported for template elements.", stacklevel=2
            )
            return

        display(value, target=self.id)

    @property
    def children(self):
        return [element_from_dom(el) for el in self._dom_element.children]

    @property
    def parent(self):
        if self._parent:
            return self._parent

        if self._dom_element.parentElement:
            self._parent = element_from_dom(self._dom_element.parentElement)

        return self._parent

    @property
    def style(self):
        return self._style

    def append(self, child):
        if isinstance(child, Element):
            self._dom_element.appendChild(child._dom_element)

        elif isinstance(child, ElementCollection):
            for el in child:
                self._dom_element.appendChild(el._dom_element)

        else:
            # In this case we know it's not an Element or an ElementCollection, so we
            # guess that it's either a DOM element or NodeList returned via the ffi.
            try:
                # First, we try to see if it's an element by accessing the 'tagName'
                # attribute.
                child.tagName
                self._dom_element.appendChild(child)

            except AttributeError:
                try:
                    # Ok, it's not an element, so let's see if it's a NodeList by
                    # accessing the 'length' attribute.
                    child.length
                    for element_ in child:
                        self._dom_element.appendChild(element_)

                except AttributeError:
                    # Nope! This is not an element or a NodeList.
                    raise TypeError(
                        f'Element "{child}" is a proxy object, but not a valid element or a NodeList.'
                    )

    def clone(self, new_id=None):
        """Make a clone of the element (clones the underlying DOM object too)."""
        el = element_from_dom(self._dom_element.cloneNode(True))
        el.id = new_id
        return el

    def find(self, selector):
        """Return an ElementCollection representing all the child elements that
        match the specified selector.

        Args:
            selector (str): A string containing a selector expression

        Returns:
            ElementCollection: A collection of elements matching the selector
        """
        return ElementCollection([
            element_from_dom(el) for el in self._dom_element.querySelectorAll(selector)
        ])

    def show_me(self):
        """Scroll the element into view."""
        self._dom_element.scrollIntoView()


class Classes:
    """A 'more Pythonic' interface to an element's `classList`."""

    def __init__(self, element: Element):
        self._element = element
        self._class_list = self._element._dom_element.classList

    def __contains__(self, item):
        return item in self._class_list

    def __eq__(self, other):
        # We allow comparison with either another `Classes` instance...
        if isinstance(other, Classes):
            compare_with = list(other._class_list)

        # ...or iterables of strings.
        else:
            # TODO: Check MP for existence of better iterable test.
            try:
                compare_with = iter(other)

            except TypeError:
                return False

        return set(self._class_list) == set(compare_with)

    def __iter__(self):
        return iter(self._class_list)

    def __len__(self):
        return self._class_list.length

    def __repr__(self):
        return f"ClassList({', '.join(self._class_list)})"

    def __str__(self):
        return ' '.join(self._class_list)

    def add(self, *class_names):
        for class_name in class_names:
            if isinstance(class_name, list):
                for item in class_name:
                    self.add(item)

            else:
                self._class_list.add(class_name)

    def contains(self, class_name):
        return class_name in self

    def remove(self, *class_names):
        for class_name in class_names:
            if isinstance(class_name, list):
                for item in class_name:
                    self.remove(item)

            else:
                self._class_list.remove(class_name)

    def replace(self, old_class, new_class):
        self.remove(old_class)
        self.add(new_class)

    def toggle(self, class_name):
        if class_name in self:
            self.remove(class_name)
            return False

        self.add(class_name)
        return True


class HasOptions:
    """Mix-in for elements that have an options attribute.

    The elements that support options are: <datalist>, <optgroup>, and <select>.
    """

    @property
    def options(self):
        if not hasattr(self, '_options'):
            self._options = Options(self)

        return self._options


class Options:
    """This class represents the <option>s of a <datalist>, <optgroup> or <select>
    element.

    It allows to access to add and remove <option>s by using the `add` and `remove`
    methods.
    """

    def __init__(self, element: Element) -> None:
        self._element = element

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
                before = before._dom_element

        self._element._dom_element.add(option, before)

    def remove(self, item: int) -> None:
        """Remove the option at the specified index"""
        self._element._dom_element.remove(item)

    def clear(self) -> None:
        """Remove all the options"""
        for i in range(len(self)):
            self.remove(0)

    @property
    def options(self):
        """Return the list of options"""
        return [element_from_dom(opt) for opt in self._element._dom_element.options]

    @property
    def selected(self):
        """Return the selected option"""
        return self.options[self._element._dom_element.selectedIndex]

    def __iter__(self):
        yield from self.options

    def __len__(self):
        return len(self.options)

    def __repr__(self):
        return f"{self.__class__.__name__} (length: {len(self)}) {self.options}"

    def __getitem__(self, key):
        return self.options[key]


class Style:
    """A dict-like interface to an elements css style."""

    def __init__(self, element: Element) -> None:
        self._element = element
        self._style = self._element._dom_element.style

    def __getitem__(self, key):
        return self._style.getPropertyValue(key)

    def __setitem__(self, key, value):
        self._style.setProperty(key, value)

    def remove(self, key):
        self._style.removeProperty(key)

    def set(self, **kws):
        for k, v in kws.items():
            self._element._dom_element.style.setProperty(k, v)

    # CSS Properties
    # Reference: https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts#L3799C1-L5005C2
    # Following properties automatically generated from the above reference using
    # tools/codegen_css_proxy.py
    @property
    def visible(self):
        return self._element._dom_element.style.visibility

    @visible.setter
    def visible(self, value):
        self._element._dom_element.style.visibility = value


class ContainerElement(Element):
    def __init__(self, *args, children=None, dom_element=None, style=None, classes=None, **kwargs):
        super().__init__(dom_element=dom_element, style=style, classes=classes, **kwargs)

        for child in list(args) + (children or []):
            if isinstance(child, Element) or isinstance (child, ElementCollection):
                self.append(child)

            else:
                self.html += child


# IMPORTANT: For all HTML components defined below, we are not mapping all possible
# attributes, just the global and the most common ones. If you need to access a
# specific attribute, you can always use the `_dom_element.<attribute>`
class a(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a"""

    tag = "a"

    download = DOMProperty("download")
    href = DOMProperty("href")
    referrerpolicy = DOMProperty("referrerpolicy")
    rel = DOMProperty("rel")
    target = DOMProperty("target")
    type = DOMProperty("type")


class abbr(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr"""

    tag = "abbr"


class address(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address"""

    tag = "address"


class area(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area"""

    tag = "area"

    alt = DOMProperty("alt")
    coords = DOMProperty("coords")
    download = DOMProperty("download")
    href = DOMProperty("href")
    ping = DOMProperty("ping")
    referrerpolicy = DOMProperty("referrerpolicy")
    rel = DOMProperty("rel")
    shape = DOMProperty("shape")
    target = DOMProperty("target")


class article(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article"""

    tag = "article"


class aside(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside"""

    tag = "aside"


class audio(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio"""

    tag = "audio"

    autoplay = DOMProperty("autoplay")
    controls = DOMProperty("controls")
    controlslist = DOMProperty("controlslist")
    crossorigin = DOMProperty("crossorigin")
    disableremoteplayback = DOMProperty("disableremoteplayback")
    loop = DOMProperty("loop")
    muted = DOMProperty("muted")
    preload = DOMProperty("preload")
    src = DOMProperty("src")


class b(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b"""

    tag = "b"


class base(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base"""

    tag = "base"

    href = DOMProperty("href")
    target = DOMProperty("target")


class blockquote(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote"""

    tag = "blockquote"

    cite = DOMProperty("cite")


class body(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body"""

    tag = "body"


class br(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br"""

    tag = "br"


class button(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button"""

    tag = "button"

    autofocus = DOMProperty("autofocus")
    disabled = DOMProperty("disabled")
    form = DOMProperty("form")
    formaction = DOMProperty("formaction")
    formenctype = DOMProperty("formenctype")
    formmethod = DOMProperty("formmethod")
    formnovalidate = DOMProperty("formnovalidate")
    formtarget = DOMProperty("formtarget")
    name = DOMProperty("name")
    type = DOMProperty("type")
    value = DOMProperty("value")


class canvas(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas"""

    tag = "canvas"

    height = DOMProperty("height")
    width = DOMProperty("width")

    def download(self, filename: str = "snapped.png") -> None:
        """Download the current element with the filename provided in input.

        Inputs:
            * filename (str): name of the file being downloaded

        Output:
            None
        """
        link = self.create("a")
        link._dom_element.download = filename
        link._dom_element.href = self._dom_element.toDataURL()
        link._dom_element.click()

    def draw(self, what, width, height):
        """Draw `what` on the current element

        Inputs:

            * what (canvas image source): An element to draw into the context. The
                specification permits any canvas image source, specifically, an
                HTMLImageElement, an SVGImageElement, an HTMLVideoElement,
                an HTMLCanvasElement, an ImageBitmap, an OffscreenCanvas, or a
                VideoFrame.
        """
        if isinstance(what, Element):
            what = what._dom_element

        # https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        self._dom_element.getContext("2d").drawImage(what, 0, 0, width, height)


class caption(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption"""

    tag = "caption"


class cite(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite"""

    tag = "cite"


class code(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code"""

    tag = "code"


class col(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col"""

    tag = "col"

    span = DOMProperty("span")


class colgroup(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup"""

    tag = "colgroup"


class data(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data"""

    tag = "data"

    value = DOMProperty("value")


class datalist(ContainerElement, HasOptions):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist"""

    tag = "datalist"


class dd(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd"""

    tag = "dd"


class del_(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del"""

    tag = "del"

    cite = DOMProperty("cite")
    datetime = DOMProperty("datetime")


class details(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details"""

    tag = "details"

    open = DOMProperty("open")


class dialog(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog"""

    tag = "dialog"

    open = DOMProperty("open")


class div(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div"""

    tag = "div"


class dl(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl"""

    tag = "dl"

    value = DOMProperty("value")


class dt(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt"""

    tag = "dt"


class em(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em"""

    tag = "em"


class embed(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed"""

    tag = "embed"

    height = DOMProperty("height")
    src = DOMProperty("src")
    type = DOMProperty("type")
    width = DOMProperty("width")


class fieldset(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset"""

    tag = "fieldset"

    disabled = DOMProperty("disabled")
    form = DOMProperty("form")
    name = DOMProperty("name")


class figcaption(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption"""

    tag = "figcaption"


class figure(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure"""

    tag = "figure"


class footer(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer"""

    tag = "footer"


class form(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form"""

    tag = "form"

    accept_charset = DOMProperty("accept-charset")
    action = DOMProperty("action")
    autocapitalize = DOMProperty("autocapitalize")
    autocomplete = DOMProperty("autocomplete")
    enctype = DOMProperty("enctype")
    name = DOMProperty("name")
    method = DOMProperty("method")
    nonvalidate = DOMProperty("nonvalidate")
    rel = DOMProperty("rel")
    target = DOMProperty("target")


class h1(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1"""

    tag = "h1"


class h2(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2"""

    tag = "h2"


class h3(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3"""

    tag = "h3"


class h4(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4"""

    tag = "h4"


class h5(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5"""

    tag = "h5"


class h6(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6"""

    tag = "h6"


class head(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head"""

    tag = "head"


class header(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header"""

    tag = "header"


class hgroup(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup"""

    tag = "hgroup"


class hr(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr"""

    tag = "hr"

    align = DOMProperty("align")
    color = DOMProperty("color")
    noshade = DOMProperty("noshade")
    size = DOMProperty("size")
    width = DOMProperty("width")


class html(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html"""

    tag = "html"


class i(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i"""

    tag = "i"


class iframe(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe"""

    tag = "iframe"

    allow = DOMProperty("allow")
    allowfullscreen = DOMProperty("allowfullscreen")
    height = DOMProperty("height")
    loading = DOMProperty("loading")
    name = DOMProperty("name")
    referrerpolicy = DOMProperty("referrerpolicy")
    sandbox = DOMProperty("sandbox")
    src = DOMProperty("src")
    srcdoc = DOMProperty("srcdoc")
    width = DOMProperty("width")


class img(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img"""

    tag = "img"

    alt = DOMProperty("alt")
    crossorigin = DOMProperty("crossorigin")
    decoding = DOMProperty("decoding")
    fetchpriority = DOMProperty("fetchpriority")
    height = DOMProperty("height")
    ismap = DOMProperty("ismap")
    loading = DOMProperty("loading")
    referrerpolicy = DOMProperty("referrerpolicy")
    sizes = DOMProperty("sizes")
    src = DOMProperty("src")
    width = DOMProperty("width")


# NOTE: Input is a reserved keyword in Python, so we use input_ instead
class input_(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input"""

    tag = "input"

    accept = DOMProperty("accept")
    alt = DOMProperty("alt")
    autofocus = DOMProperty("autofocus")
    capture = DOMProperty("capture")
    checked = DOMProperty("checked")
    dirname = DOMProperty("dirname")
    disabled = DOMProperty("disabled")
    form = DOMProperty("form")
    formaction = DOMProperty("formaction")
    formenctype = DOMProperty("formenctype")
    formmethod = DOMProperty("formmethod")
    formnovalidate = DOMProperty("formnovalidate")
    formtarget = DOMProperty("formtarget")
    height = DOMProperty("height")
    list = DOMProperty("list")
    max = DOMProperty("max")
    maxlength = DOMProperty("maxlength")
    min = DOMProperty("min")
    minlength = DOMProperty("minlength")
    multiple = DOMProperty("multiple")
    name = DOMProperty("name")
    pattern = DOMProperty("pattern")
    placeholder = DOMProperty("placeholder")
    popovertarget = DOMProperty("popovertarget")
    popovertargetaction = DOMProperty("popovertargetaction")
    readonly = DOMProperty("readonly")
    required = DOMProperty("required")
    size = DOMProperty("size")
    src = DOMProperty("src")
    step = DOMProperty("step")
    type = DOMProperty("type")
    value = DOMProperty("value")
    width = DOMProperty("width")


class ins(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins"""

    tag = "ins"

    cite = DOMProperty("cite")
    datetime = DOMProperty("datetime")


class kbd(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd"""

    tag = "kbd"


class label(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label"""

    tag = "label"

    for_ = DOMProperty("for")


class legend(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend"""

    tag = "legend"


class li(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li"""

    tag = "li"

    value = DOMProperty("value")


class link(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link"""

    tag = "link"

    as_ = DOMProperty("as")
    crossorigin = DOMProperty("crossorigin")
    disabled = DOMProperty("disabled")
    fetchpriority = DOMProperty("fetchpriority")
    href = DOMProperty("href")
    imagesizes = DOMProperty("imagesizes")
    imagesrcset = DOMProperty("imagesrcset")
    integrity = DOMProperty("integrity")
    media = DOMProperty("media")
    rel = DOMProperty("rel")
    referrerpolicy = DOMProperty("referrerpolicy")
    sizes = DOMProperty("sizes")
    title = DOMProperty("title")
    type = DOMProperty("type")


class main(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main"""

    tag = "main"


class map_(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map"""

    tag = "map"

    name = DOMProperty("name")


class mark(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark"""

    tag = "mark"


class menu(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu"""

    tag = "menu"


class meta(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta"""

    tag = "meta"

    charset = DOMProperty("charset")
    content = DOMProperty("content")
    http_equiv = DOMProperty("http-equiv")
    name = DOMProperty("name")


class meter(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter"""

    tag = "meter"

    form = DOMProperty("form")
    high = DOMProperty("high")
    low = DOMProperty("low")
    max = DOMProperty("max")
    min = DOMProperty("min")
    optimum = DOMProperty("optimum")
    value = DOMProperty("value")


class nav(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav"""

    tag = "nav"


class object_(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object"""

    tag = "object"

    data = DOMProperty("data")
    form = DOMProperty("form")
    height = DOMProperty("height")
    name = DOMProperty("name")
    type = DOMProperty("type")
    usemap = DOMProperty("usemap")
    width = DOMProperty("width")


class ol(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol"""

    tag = "ol"

    reversed = DOMProperty("reversed")
    start = DOMProperty("start")
    type = DOMProperty("type")


class optgroup(ContainerElement, HasOptions):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup"""

    tag = "optgroup"

    disabled = DOMProperty("disabled")
    label = DOMProperty("label")


class option(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option"""

    tag = "option"

    disabled = DOMProperty("value")
    label = DOMProperty("label")
    selected = DOMProperty("selected")
    value = DOMProperty("value")


class output(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output"""

    tag = "output"

    for_ = DOMProperty("for")
    form = DOMProperty("form")
    name = DOMProperty("name")


class p(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p"""

    tag = "p"


class param(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p"""

    tag = "p"


class picture(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture"""

    tag = "picture"


class pre(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre"""

    tag = "pre"


class progress(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress"""

    tag = "progress"

    max = DOMProperty("max")
    value = DOMProperty("value")


class q(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q"""

    tag = "q"

    cite = DOMProperty("cite")


class s(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s"""

    tag = "s"


class script(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script"""

    tag = "script"

    # Let's add async manually since it's a reserved keyword in Python
    async_ = DOMProperty("async")
    blocking = DOMProperty("blocking")
    crossorigin = DOMProperty("crossorigin")
    defer = DOMProperty("defer")
    fetchpriority = DOMProperty("fetchpriority")
    integrity = DOMProperty("integrity")
    nomodule = DOMProperty("nomodule")
    nonce = DOMProperty("nonce")
    referrerpolicy = DOMProperty("referrerpolicy")
    src = DOMProperty("src")
    type = DOMProperty("type")


class section(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section"""

    tag = "section"


class select(ContainerElement, HasOptions):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select"""

    tag = "select"

    value = DOMProperty("value")


class small(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small"""

    tag = "small"


class source(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source"""

    tag = "source"

    media = DOMProperty("media")
    sizes = DOMProperty("sizes")
    src = DOMProperty("src")
    srcset = DOMProperty("srcset")
    type = DOMProperty("type")


class span(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span"""

    tag = "span"


class strong(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong"""

    tag = "strong"


class style(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style"""

    tag = "style"

    blocking = DOMProperty("blocking")
    media = DOMProperty("media")
    nonce = DOMProperty("nonce")
    title = DOMProperty("title")


class sub(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub"""

    tag = "sub"


class summary(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary"""

    tag = "summary"


class sup(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup"""

    tag = "sup"


class table(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table"""

    tag = "table"


class tbody(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody"""

    tag = "tbody"


class td(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td"""

    tag = "td"

    colspan = DOMProperty("colspan")
    headers = DOMProperty("headers")
    rowspan = DOMProperty("rowspan")


class template(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template"""

    tag = "template"

    shadowrootmode = DOMProperty("shadowrootmode")


class textarea(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea"""

    tag = "textarea"

    autocapitalize = DOMProperty("autocapitalize")
    autocomplete = DOMProperty("autocomplete")
    autofocus = DOMProperty("autofocus")
    cols = DOMProperty("cols")
    dirname = DOMProperty("dirname")
    disabled = DOMProperty("disabled")
    form = DOMProperty("form")
    maxlength = DOMProperty("maxlength")
    minlength = DOMProperty("minlength")
    name = DOMProperty("name")
    placeholder = DOMProperty("placeholder")
    readonly = DOMProperty("readonly")
    required = DOMProperty("required")
    rows = DOMProperty("rows")
    spellcheck = DOMProperty("spellcheck")
    value = DOMProperty("value")
    wrap = DOMProperty("wrap")


class tfoot(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot"""

    tag = "tfoot"


class th(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th"""

    tag = "th"


class thead(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead"""

    tag = "thead"


class time(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time"""

    tag = "time"

    datetime = DOMProperty("datetime")


class title(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title"""

    tag = "title"


class tr(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr"""

    tag = "tr"

    abbr = DOMProperty("abbr")
    colspan = DOMProperty("colspan")
    headers = DOMProperty("headers")
    rowspan = DOMProperty("rowspan")
    scope = DOMProperty("scope")


class track(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track"""

    tag = "track"

    default = DOMProperty("default")
    kind = DOMProperty("kind")
    label = DOMProperty("label")
    src = DOMProperty("src")
    srclang = DOMProperty("srclang")


class u(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u"""

    tag = "u"


class ul(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul"""

    tag = "ul"


class var(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var"""

    tag = "var"


class video(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video"""

    tag = "video"

    autoplay = DOMProperty("autoplay")
    controls = DOMProperty("controls")
    crossorigin = DOMProperty("crossorigin")
    disablepictureinpicture = DOMProperty("disablepictureinpicture")
    disableremoteplayback = DOMProperty("disableremoteplayback")
    height = DOMProperty("height")
    loop = DOMProperty("loop")
    muted = DOMProperty("muted")
    playsinline = DOMProperty("playsinline")
    poster = DOMProperty("poster")
    preload = DOMProperty("preload")
    src = DOMProperty("src")
    width = DOMProperty("width")

    def snap(
        self,
        to: Element | str = None,
        width: int | None = None,
        height: int | None = None,
    ):
        """
        Captures a snapshot of a video.

        Inputs:

            * to: element where to save the snapshot of the video frame to
            * width: width of the image
            * height: height of the image

        Output:
            (Element) canvas element where the video frame snapshot was drawn into
        """
        if to is None:
            to_canvas = self.create("canvas")
            if width is None:
                width = self._dom_element.width
            if height is None:
                height = self._dom_element.height
            to_canvas._dom_element.width = width
            to_canvas._dom_element.height = height

        elif isinstance(to, Element):
            if to._dom_element.tagName != "CANVAS":
                raise TypeError("Element to snap to must a canvas.")
            to_canvas = to

        elif getattr(to, "tagName", "") == "CANVAS":
            to_canvas = canvas(to)

        # If 'to' is a string, then assume it is a query selector.
        elif isinstance(to, str):
            nodelist = document.querySelectorAll(to)
            if nodelist.length == 0:
                raise TypeError("No element with selector {to} to snap to.")

            if nodelist[0].tagName != "CANVAS":
                raise TypeError("Element to snap to must a be canvas.")

            to_canvas = canvas(nodelist[0])

        to_canvas.draw(self, width, height)

        return canvas


class wbr(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr"""

    tag = "wbr"


# Custom Elements
class grid(ContainerElement):
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

    def __eq__(self, obj):
        """Check if the element is the same as the other element by comparing
        the underlying DOM element"""
        return isinstance(obj, ElementCollection) and obj._elements == self._elements

    def __getitem__(self, key):
        # If it's an integer we use it to access the elements in the collection
        if isinstance(key, int):
            return self._elements[key]

        # If it's a slice we use it to support slice operations over the elements
        # in the collection
        elif isinstance(key, slice):
            return ElementCollection(self._elements[key])

        # If it's anything else (basically a string) we use it as a query selector.
        # TODO: Write tests!
        elements = self._element.querySelectorAll(key)
        return ElementCollection([element_from_dom(el) for el in elements])

    def __iter__(self):
        yield from self._elements

    def __len__(self):
        return len(self._elements)

    def __repr__(self):
        return f"{self.__class__.__name__} (length: {len(self._elements)}) {self._elements}"

    def _get_attribute(self, attr, index=None):
        if index is None:
            return [getattr(el, attr) for el in self._elements]

        # As JQuery, when getting an attr, only return it for the first element
        return getattr(self._elements[index], attr)

    def _set_attribute(self, attr, value):
        for el in self._elements:
            setattr(el, attr, value)

    @property
    def children(self):
        return self._elements

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


ELEMENT_CLASSES = [
    # We put grid first because it is really just a <div> but we want the div class to
    # be used if wrapping existing js elements that we have not tagged with a
    # `data-pyscript-type` attribute (last one is the winner when it comes to this
    # list).
    grid,
    # The rest in alphabetical order.
    a, abbr, address, area, article, aside, audio,
    b, base, blockquote, body, br, button,
    canvas, caption, cite, code, col, colgroup,
    data, datalist, dd, del_, details, dialog, div, dl, dt,
    em, embed,
    fieldset, figcaption, figure, footer, form,
    h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html,
    i, iframe, img, input_, ins,
    kbd,
    label, legend, li, link,
    main, map_, mark, menu, meta, meter,
    nav,
    object_, ol, optgroup, option, output,
    p, param, picture, pre, progress,
    q,
    s, script, section, select, small, source, span, strong, style, sub, summary, sup,
    table, tbody, td, template, textarea, tfoot, th, thead, time, title, tr, track,
    u, ul,
    var, video,
    wbr,
]


ELEMENT_CLASSES_BY_NAME = {cls.__name__: cls for cls in ELEMENT_CLASSES}


ELEMENT_CLASSES_BY_TAG = {cls.tag: cls for cls in ELEMENT_CLASSES}
