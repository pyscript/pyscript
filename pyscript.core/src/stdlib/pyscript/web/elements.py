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


class Element:
    @classmethod
    def from_dom_element(cls, dom_element):
        """Create an instance of the appropriate subclass of `Element` for a DOM
        element.

        If the DOM element was created via an `Element` (i.e. by us) it will have a data
        attribute named `data-pyscript-type` that contains the name of the subclass
        that created it. Hence, if the `data-pyscript-type` attribute *is* present we
        look up the subclass by name and create an instance of that. Otherwise, we make
        a 'best-guess' and look up the `Element` subclass by the DOM element's tag name
        (this is NOT fool-proof as many subclasses might use a `<div>`, but close enough
        for jazz).
        """

        # We use "getAttribute" here instead of `js_element.dataset.pyscriptType` as the
        # latter throws an `AttributeError` if the value isn't set. This way we just get
        # `None` which seems cleaner.
        cls_name = dom_element.getAttribute("data-pyscript-type")
        if cls_name:
            element_cls = ELEMENT_CLASSES_BY_NAME.get(cls_name.lower())

        else:
            element_cls = ELEMENT_CLASSES_BY_TAG.get(dom_element.tagName.lower())

        # For any unknown elements (custom tags etc.) create an instance of this
        # class ('Element').
        if not element_cls:
            element_cls = cls

        return element_cls(dom_element=dom_element)

    def __init__(self, dom_element=None, classes=None, style=None, **kwargs):
        """Create a new, or wrap an existing DOM element.

        If `dom_element` is None we are being called to *create* a new element.
        Otherwise, we are being called to *wrap* an existing DOM element.
        """
        self._dom_element = dom_element or document.createElement(self.tag)

        # Tag the DOM element with our class name.
        #
        # Using the `dataset` attribute is how you programmatically add `data-xxx`
        # attributes to a DOM element. In this case it will set an attribute that
        # appears in the DOM as `data-pyscript-type`.
        self._dom_element.dataset.pyscriptType = type(self).__name__

        self._parent = None
        self._classes = Classes(self)
        self._style = Style(self)

        # Set any specified classes, styles, and DOM properties.
        self.update(classes=classes, style=style, **kwargs)

    def __getattr__(self, name):
        if name.endswith("_"):
            name = name[:-1]

        return getattr(self._dom_element, name)

    def __setattr__(self, name, value):
        # This class overrides `__setattr__` to delegate "public" attributes to the
        # elements in the collection, but we don't use the usual Python pattern where we
        # set attributes on the collection itself via `self.__dict__` as it is not yet
        # supported in our build of MicroPython. Instead, we handle it here.
        if name.startswith("_"):
            super().__setattr__(name, value)

        else:
            if name.endswith("_"):
                name = name[:-1]

            setattr(self._dom_element, name, value)

    def update(self, classes=None, style=None, **kwargs):
        """Update the element with the specified classes, styles, and DOM properties."""

        if classes:
            self.classes.add(classes)

        if isinstance(style, dict):
            self.style.set(**style)

        elif style is not None:
            raise ValueError(
                f"Style should be a dictionary, received {style} "
                f"(type {type(style)}) instead."
            )

        self._set_dom_properties(**kwargs)

    def _set_dom_properties(self, **kwargs):
        """Set the specified DOM properties.

        Args:
            **kwargs: The properties to set
        """
        for name, value in kwargs.items():
            setattr(self, name, value)

    def __eq__(self, obj):
        """Check for equality by comparing the underlying DOM element."""
        return isinstance(obj, Element) and obj._dom_element == self._dom_element

    @property
    def children(self):
        return ElementCollection(
            [Element.from_dom_element(el) for el in self._dom_element.children]
        )

    @property
    def classes(self):
        return self._classes

    @property
    def parent(self):
        if self._parent:
            return self._parent

        if self._dom_element.parentElement:
            self._parent = Element.from_dom_element(self._dom_element.parentElement)

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
                        f'Element "{child}" is a proxy object, "'
                        f"but not a valid element or a NodeList."
                    )

    def clone(self, clone_id=None):
        """Make a clone of the element (clones the underlying DOM object too)."""
        clone = Element.from_dom_element(self._dom_element.cloneNode(True))
        clone.id = clone_id
        return clone

    def find(self, selector):
        """Return an ElementCollection representing all the child elements that
        match the specified selector.

        Args:
            selector (str): A string containing a selector expression

        Returns:
            ElementCollection: A collection of elements matching the selector
        """
        return ElementCollection(
            [
                Element.from_dom_element(dom_element)
                for dom_element in self._dom_element.querySelectorAll(selector)
            ]
        )

    def show_me(self):
        """Scroll the element into view."""
        self._dom_element.scrollIntoView()


class Classes:
    """A set-like interface to an element's `classList`."""

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
        return f"Classes({', '.join(self._class_list)})"

    def __str__(self):
        return " ".join(self._class_list)

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

    def toggle(self, *class_names):
        for class_name in class_names:
            if class_name in self:
                self.remove(class_name)

            else:
                self.add(class_name)


class HasOptions:
    """Mix-in for elements that have an options attribute.

    The elements that support options are: <datalist>, <optgroup>, and <select>.
    """

    @property
    def options(self):
        if not hasattr(self, "_options"):
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
        return [
            Element.from_dom_element(opt) for opt in self._element._dom_element.options
        ]

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
    """A dict-like interface to an element's css style."""

    def __init__(self, element: Element) -> None:
        self._element = element
        self._style = self._element._dom_element.style

    def __getitem__(self, key):
        return self._style.getPropertyValue(key)

    def __setitem__(self, key, value):
        self._style.setProperty(key, value)

    def remove(self, key):
        self._style.removeProperty(key)

    def set(self, **kwargs):
        for key, value in kwargs.items():
            self._element._dom_element.style.setProperty(key, value)

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
    """Base class for elements that can contain other elements."""

    def __init__(
        self, *args, children=None, dom_element=None, style=None, classes=None, **kwargs
    ):
        super().__init__(
            dom_element=dom_element, style=style, classes=classes, **kwargs
        )

        for child in list(args) + (children or []):
            if isinstance(child, Element) or isinstance(child, ElementCollection):
                self.append(child)

            else:
                self.innerHTML += child


# Classes for every element type. If the element type (e.g. "input") clashes with
# either a Python keyword or common symbol, then we suffix the class name with an "_"
# (e.g. "input_").


class a(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a"""

    tag = "a"


class abbr(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr"""

    tag = "abbr"


class address(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address"""

    tag = "address"


class area(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area"""

    tag = "area"


class article(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article"""

    tag = "article"


class aside(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside"""

    tag = "aside"


class audio(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio"""

    tag = "audio"


class b(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b"""

    tag = "b"


class base(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base"""

    tag = "base"


class blockquote(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote"""

    tag = "blockquote"


class body(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body"""

    tag = "body"


class br(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br"""

    tag = "br"


class button(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button"""

    tag = "button"


class canvas(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas"""

    tag = "canvas"

    def download(self, filename: str = "snapped.png") -> None:
        """Download the current element with the filename provided in input.

        Inputs:
            * filename (str): name of the file being downloaded

        Output:
            None
        """
        download_link = a(download=filename, href=self._dom_element.toDataURL())

        # Adding the link to the DOM is recommended for browser compatibility to make
        # sure that the click works.
        self.append(download_link)

        download_link._dom_element.click()

    def draw(self, what, width=None, height=None):
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
        ctx = self._dom_element.getContext("2d")
        if width or height:
            ctx.drawImage(what, 0, 0, width, height)

        else:
            ctx.drawImage(what, 0, 0)


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


class colgroup(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup"""

    tag = "colgroup"


class data(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data"""

    tag = "data"


class datalist(ContainerElement, HasOptions):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist"""

    tag = "datalist"


class dd(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd"""

    tag = "dd"


class del_(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del"""

    tag = "del"


class details(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details"""

    tag = "details"


class dialog(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog"""

    tag = "dialog"


class div(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div"""

    tag = "div"


class dl(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl"""

    tag = "dl"


class dt(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt"""

    tag = "dt"


class em(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em"""

    tag = "em"


class embed(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed"""

    tag = "embed"


class fieldset(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset"""

    tag = "fieldset"


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


class html(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html"""

    tag = "html"


class i(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i"""

    tag = "i"


class iframe(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe"""

    tag = "iframe"


class img(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img"""

    tag = "img"


class input_(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input"""

    tag = "input"


class ins(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins"""

    tag = "ins"


class kbd(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd"""

    tag = "kbd"


class label(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label"""

    tag = "label"


class legend(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend"""

    tag = "legend"


class li(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li"""

    tag = "li"


class link(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link"""

    tag = "link"


class main(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main"""

    tag = "main"


class map_(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map"""

    tag = "map"


class mark(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark"""

    tag = "mark"


class menu(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu"""

    tag = "menu"


class meta(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta"""

    tag = "meta"


class meter(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter"""

    tag = "meter"


class nav(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav"""

    tag = "nav"


class object_(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object"""

    tag = "object"


class ol(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol"""

    tag = "ol"


class optgroup(ContainerElement, HasOptions):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup"""

    tag = "optgroup"


class option(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option"""

    tag = "option"


class output(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output"""

    tag = "output"


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


class q(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q"""

    tag = "q"


class s(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s"""

    tag = "s"


class script(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script"""

    tag = "script"


class section(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section"""

    tag = "section"


class select(ContainerElement, HasOptions):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select"""

    tag = "select"


class small(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small"""

    tag = "small"


class source(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source"""

    tag = "source"


class span(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span"""

    tag = "span"


class strong(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong"""

    tag = "strong"


class style(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style"""

    tag = "style"


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


class template(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template"""

    tag = "template"


class textarea(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea"""

    tag = "textarea"


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


class title(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title"""

    tag = "title"


class tr(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr"""

    tag = "tr"


class track(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track"""

    tag = "track"


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

    def snap(
        self,
        to: Element | str = None,
        width: int | None = None,
        height: int | None = None,
    ):
        """
        Capture a snapshot (i.e. a single frame) of a video to a canvas.

        Inputs:

            * to: the canvas to save the video frame to (if None, one is created).
            * width: width of the snapshot (defaults to the video width).
            * height: height of the snapshot (defaults to the video height).

        Output:
            (Element) canvas element where the video frame snapshot was drawn into
        """
        width = width if width is not None else self.videoWidth
        height = height if height is not None else self.videoHeight

        if to is None:
            to = canvas(width=width, height=height)

        elif isinstance(to, Element):
            if to.tag != "canvas":
                raise TypeError("Element to snap to must be a canvas.")

        elif getattr(to, "tagName", "") == "CANVAS":
            to = canvas(dom_element=to)

        # If 'to' is a string, then assume it is a query selector.
        elif isinstance(to, str):
            nodelist = document.querySelectorAll(to)  # NOQA
            if nodelist.length == 0:
                raise TypeError("No element with selector {to} to snap to.")

            if nodelist[0].tagName != "CANVAS":
                raise TypeError("Element to snap to must be a canvas.")

            to = canvas(dom_element=nodelist[0])

        to.draw(self, width, height)

        return to


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
        if gap is not None:
            self.style["gap"] = gap


class ClassesCollection:
    def __init__(self, collection: "ElementCollection") -> None:
        self._collection = collection

    def __contains__(self, class_name):
        for element in self._collection:
            if class_name in element.classes:
                return True

        return False

    def __eq__(self, other):
        return (
            isinstance(other, ClassesCollection)
            and self._collection == other._collection
        )

    def __iter__(self):
        for class_name in self._all_class_names():
            yield class_name

    def __len__(self):
        return len(self._all_class_names())

    def __repr__(self):
        return f"ClassesCollection({repr(self._collection)})"

    def __str__(self):
        return " ".join(self._all_class_names())

    def add(self, *class_names):
        for element in self._collection:
            element.classes.add(*class_names)

    def contains(self, class_name):
        return class_name in self

    def remove(self, *class_names):
        for element in self._collection:
            element.classes.remove(*class_names)

    def replace(self, old_class, new_class):
        for element in self._collection:
            element.classes.replace(old_class, new_class)

    def toggle(self, *class_names):
        for element in self._collection:
            element.classes.toggle(*class_names)

    def _all_class_names(self):
        all_class_names = set()
        for element in self._collection:
            for class_name in element.classes:
                all_class_names.add(class_name)

        return all_class_names


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

    def __repr__(self):
        return f"StyleCollection({repr(self._collection)})"

    def remove(self, key):
        for element in self._collection._elements:
            element.style.remove(key)


class ElementCollection:
    def __init__(self, elements: [Element]) -> None:
        self._elements = elements
        self._classes = ClassesCollection(self)
        self._style = StyleCollection(self)

    def __eq__(self, obj):
        """Check for equality by comparing the underlying DOM elements."""
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
        return self.find(key)

    def __iter__(self):
        yield from self._elements

    def __len__(self):
        return len(self._elements)

    def __repr__(self):
        return (
            f"{self.__class__.__name__} (length: {len(self._elements)}) "
            f"{self._elements}"
        )

    def __getattr__(self, item):
        return self._get_attribute(item)

    def __setattr__(self, key, value):
        # This class overrides `__setattr__` to delegate "public" attributes to the
        # elements in the collection, but we don't use the usual Python pattern where we
        # set attributes on the collection itself via `self.__dict__` as it is not yet
        # supported in our build of MicroPython. Instead, we handle it here.
        if key.startswith("_"):
            super().__setattr__(key, value)

        else:
            self._set_attribute(key, value)

    @property
    def children(self):
        return self._elements

    @property
    def classes(self):
        return self._classes

    @property
    def style(self):
        return self._style

    def find(self, selector):
        elements = []
        for element in self._elements:
            elements.extend(element.find(selector))

        return ElementCollection(elements)

    def _get_attribute(self, attr, index=None):
        if index is None:
            return [getattr(el, attr) for el in self._elements]

        # As JQuery, when getting an attr, only return it for the first element
        return getattr(self._elements[index], attr)

    def _set_attribute(self, attr, value):
        for el in self._elements:
            setattr(el, attr, value)


# fmt: off
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
# fmt: on


# Lookup tables to get an element class by its name or tag.
ELEMENT_CLASSES_BY_NAME = {cls.__name__: cls for cls in ELEMENT_CLASSES}
ELEMENT_CLASSES_BY_TAG = {cls.tag: cls for cls in ELEMENT_CLASSES}
