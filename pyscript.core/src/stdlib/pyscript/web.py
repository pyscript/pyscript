"""Lightweight interface to the DOM and HTML elements."""

# `when` is not used in this module. It is imported here save the user an additional
# import (i.e. they can get what they need from `pyscript.web`).
from pyscript import document, when  # NOQA


def wrap_dom_element(dom_element):
    """Wrap an existing DOM element in an instance of a subclass of `Element`.

    This is just a convenience function to avoid having to import the `Element` class
    and use its class method.
    """

    return Element.wrap_dom_element(dom_element)


class Element:
    # A lookup table to get an `Element` subclass by tag name. Used when wrapping an
    # existing DOM element.
    element_classes_by_tag_name = {}

    @classmethod
    def get_tag_name(cls):
        """Return the HTML tag name for the class.

        For classes that have a trailing underscore (because they clash with a Python
        keyword or built-in), we remove it to get the tag name. e.g. for the `input_`
        class, the tag name is `input`.

        """
        return cls.__name__.replace("_", "")

    @classmethod
    def register_element_classes(cls, element_classes):
        """Register an iterable of element classes."""
        for element_class in element_classes:
            tag_name = element_class.get_tag_name()
            cls.element_classes_by_tag_name[tag_name] = element_class

    @classmethod
    def unregister_element_classes(cls, element_classes):
        """Unregister an iterable of element classes."""
        for element_class in element_classes:
            tag_name = element_class.get_tag_name()
            cls.element_classes_by_tag_name.pop(tag_name, None)

    @classmethod
    def wrap_dom_element(cls, dom_element):
        """Wrap an existing DOM element in an instance of a subclass of `Element`.

        We look up the `Element` subclass by the DOM element's tag name. For any unknown
        elements (custom tags etc.) use *this* class (`Element`).
        """
        element_cls = cls.element_classes_by_tag_name.get(
            dom_element.tagName.lower(), cls
        )

        return element_cls(dom_element=dom_element)

    def __init__(self, dom_element=None, classes=None, style=None, **kwargs):
        """Create a new, or wrap an existing DOM element.

        If `dom_element` is None we are being called to *create* a new element.
        Otherwise, we are being called to *wrap* an existing DOM element.
        """
        self._dom_element = dom_element or document.createElement(
            type(self).get_tag_name()
        )

        # A set-like interface to the element's `classList`.
        self._classes = Classes(self)

        # A dict-like interface to the element's `style` attribute.
        self._style = Style(self)

        # Set any specified classes, styles, and DOM properties.
        self.update(classes=classes, style=style, **kwargs)

    def __eq__(self, obj):
        """Check for equality by comparing the underlying DOM element."""
        return isinstance(obj, Element) and obj._dom_element == self._dom_element

    def __getitem__(self, key):
        """Get an item within the element's children.

        If `key` is an integer or a slice we use it to index/slice the element's
        children. Otherwise, we use `key` as a query selector.
        """
        if isinstance(key, int) or isinstance(key, slice):
            return self.children[key]

        return self.find(key)

    def __getattr__(self, name):
        # This allows us to get attributes on the underlying DOM element that clash
        # with Python keywords or built-ins (e.g. the output element has an
        # attribute `for` which is a Python keyword, so you can access it on the
        # Element instance via `for_`).
        if name.endswith("_"):
            name = name[:-1]

        return getattr(self._dom_element, name)

    def __setattr__(self, name, value):
        # This class overrides `__setattr__` to delegate "public" attributes to the
        # underlying DOM element. BUT, we don't use the usual Python pattern where
        # we set attributes on the element itself via `self.__dict__` as that is not
        # yet supported in our build of MicroPython. Instead, we handle it here by
        # using super for all "private" attributes (those starting with an underscore).
        if name.startswith("_"):
            super().__setattr__(name, value)

        else:
            # This allows us to set attributes on the underlying DOM element that clash
            # with Python keywords or built-ins (e.g. the output element has an
            # attribute `for` which is a Python keyword, so you can access it on the
            # Element instance via `for_`).
            if name.endswith("_"):
                name = name[:-1]

            setattr(self._dom_element, name, value)

    @property
    def children(self):
        """Return the element's children as an `ElementCollection`."""
        return ElementCollection.wrap_dom_elements(self._dom_element.children)

    @property
    def classes(self):
        """Return the element's `classList` as a `Classes` instance."""
        return self._classes

    @property
    def parent(self):
        """Return the element's `parent `Element`."""
        if self._dom_element.parentElement is None:
            return None

        return Element.wrap_dom_element(self._dom_element.parentElement)

    @property
    def style(self):
        """Return the element's `style` attribute as a `Style` instance."""
        return self._style

    def append(self, *items):
        """Append the specified items to the element."""
        for item in items:
            if isinstance(item, Element):
                self._dom_element.appendChild(item._dom_element)

            elif isinstance(item, ElementCollection):
                for element in item:
                    self._dom_element.appendChild(element._dom_element)

            # We check for list/tuple here and NOT for any iterable as it will match
            # a JS Nodelist which is handled explicitly below.
            # NodeList.
            elif isinstance(item, list) or isinstance(item, tuple):
                for child in item:
                    self.append(child)

            else:
                # In this case we know it's not an Element or an ElementCollection, so
                # we guess that it's either a DOM element or NodeList returned via the
                # ffi.
                try:
                    # First, we try to see if it's an element by accessing the 'tagName'
                    # attribute.
                    item.tagName
                    self._dom_element.appendChild(item)

                except AttributeError:
                    try:
                        # Ok, it's not an element, so let's see if it's a NodeList by
                        # accessing the 'length' attribute.
                        item.length
                        for element_ in item:
                            self._dom_element.appendChild(element_)

                    except AttributeError:
                        # Nope! This is not an element or a NodeList.
                        raise TypeError(
                            f'Element "{item}" is a proxy object, "'
                            f"but not a valid element or a NodeList."
                        )

    def clone(self, clone_id=None):
        """Make a clone of the element (clones the underlying DOM object too)."""
        clone = Element.wrap_dom_element(self._dom_element.cloneNode(True))
        clone.id = clone_id
        return clone

    def find(self, selector):
        """Find all elements that match the specified selector.

        Return the results as a (possibly empty) `ElementCollection`.
        """
        return ElementCollection.wrap_dom_elements(
            self._dom_element.querySelectorAll(selector)
        )

    def show_me(self):
        """Convenience method for 'element.scrollIntoView()'."""
        self._dom_element.scrollIntoView()

    def update(self, classes=None, style=None, **kwargs):
        """Update the element with the specified classes, styles, and DOM properties."""

        if classes:
            self.classes.add(classes)

        if style:
            self.style.set(**style)

        for name, value in kwargs.items():
            setattr(self, name, value)


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
        """Add one or more classes to the element."""
        for class_name in class_names:
            if isinstance(class_name, list):
                for item in class_name:
                    self.add(item)

            else:
                self._class_list.add(class_name)

    def contains(self, class_name):
        """Check if the element has the specified class."""
        return class_name in self

    def remove(self, *class_names):
        """Remove one or more classes from the element."""
        for class_name in class_names:
            if isinstance(class_name, list):
                for item in class_name:
                    self.remove(item)

            else:
                self._class_list.remove(class_name)

    def replace(self, old_class, new_class):
        """Replace one of the element's classes with another."""
        self.remove(old_class)
        self.add(new_class)

    def toggle(self, *class_names):
        """Toggle one or more of the element's classes."""
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
        """Return the element's options as an `Options"""
        if not hasattr(self, "_options"):
            self._options = Options(self)

        return self._options


class Options:
    """This class represents the <option>s of a <datalist>, <optgroup> or <select>.

    It allows access to add and remove <option>s by using the `add`, `remove` and
    `clear` methods.
    """

    def __init__(self, element):
        self._element = element

    def __getitem__(self, key):
        return self.options[key]

    def __iter__(self):
        yield from self.options

    def __len__(self):
        return len(self.options)

    def __repr__(self):
        return f"{self.__class__.__name__} (length: {len(self)}) {self.options}"

    @property
    def options(self):
        """Return the list of options."""
        return [Element.wrap_dom_element(o) for o in self._element._dom_element.options]

    @property
    def selected(self):
        """Return the selected option."""
        return self.options[self._element._dom_element.selectedIndex]

    def add(self, value=None, html=None, text=None, before=None, **kwargs):
        """Add a new option to the element"""
        if value is not None:
            kwargs["value"] = value

        if html is not None:
            kwargs["innerHTML"] = html

        if text is not None:
            kwargs["text"] = text

        new_option = option(**kwargs)

        if before:
            if isinstance(before, Element):
                before = before._dom_element

        self._element._dom_element.add(new_option._dom_element, before)

    def clear(self):
        """Remove all options."""
        while len(self) > 0:
            self.remove(0)

    def remove(self, index):
        """Remove the option at the specified index."""
        self._element._dom_element.remove(index)


class Style:
    """A dict-like interface to an element's `style` attribute."""

    def __init__(self, element: Element):
        self._element = element
        self._style = self._element._dom_element.style

    def __getitem__(self, key):
        return self._style.getPropertyValue(key)

    def __setitem__(self, key, value):
        self._style.setProperty(key, value)

    def remove(self, key):
        """Remove a CSS property from the element."""
        self._style.removeProperty(key)

    def set(self, **kwargs):
        """Set one or more CSS properties on the element."""
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
                self._dom_element.insertAdjacentHTML("beforeend", child)

    def __iter__(self):
        yield from self.children


class ClassesCollection:
    """A set-like interface to the classes of the elements in a collection."""

    def __init__(self, collection):
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
        """Add one or more classes to the elements in the collection."""
        for element in self._collection:
            element.classes.add(*class_names)

    def contains(self, class_name):
        """Check if any element in the collection has the specified class."""
        return class_name in self

    def remove(self, *class_names):
        """Remove one or more classes from the elements in the collection."""

        for element in self._collection:
            element.classes.remove(*class_names)

    def replace(self, old_class, new_class):
        """Replace one of the classes in the elements in the collection with another."""
        for element in self._collection:
            element.classes.replace(old_class, new_class)

    def toggle(self, *class_names):
        """Toggle one or more classes on the elements in the collection."""
        for element in self._collection:
            element.classes.toggle(*class_names)

    def _all_class_names(self):
        all_class_names = set()
        for element in self._collection:
            for class_name in element.classes:
                all_class_names.add(class_name)

        return all_class_names


class StyleCollection:
    """A dict-like interface to the styles of the elements in a collection."""

    def __init__(self, collection):
        self._collection = collection

    def __getitem__(self, key):
        return [element.style[key] for element in self._collection._elements]

    def __setitem__(self, key, value):
        for element in self._collection._elements:
            element.style[key] = value

    def __repr__(self):
        return f"StyleCollection({repr(self._collection)})"

    def remove(self, key):
        """Remove a CSS property from the elements in the collection."""
        for element in self._collection._elements:
            element.style.remove(key)


class ElementCollection:
    @classmethod
    def wrap_dom_elements(cls, dom_elements):
        """Wrap an iterable of dom_elements in an `ElementCollection`."""

        return cls(
            [Element.wrap_dom_element(dom_element) for dom_element in dom_elements]
        )

    def __init__(self, elements: [Element]):
        self._elements = elements
        self._classes = ClassesCollection(self)
        self._style = StyleCollection(self)

    def __eq__(self, obj):
        """Check for equality by comparing the underlying DOM elements."""
        return isinstance(obj, ElementCollection) and obj._elements == self._elements

    def __getitem__(self, key):
        """Get an item in the collection.

        If `key` is an integer or a slice we use it to index/slice the collection.
        Otherwise, we use `key` as a query selector.
        """
        if isinstance(key, int):
            return self._elements[key]

        elif isinstance(key, slice):
            return ElementCollection(self._elements[key])

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

    def __getattr__(self, name):
        return [getattr(element, name) for element in self._elements]

    def __setattr__(self, name, value):
        # This class overrides `__setattr__` to delegate "public" attributes to the
        # elements in the collection. BUT, we don't use the usual Python pattern where
        # we set attributes on the collection itself via `self.__dict__` as that is not
        # yet supported in our build of MicroPython. Instead, we handle it here by
        # using super for all "private" attributes (those starting with an underscore).
        if name.startswith("_"):
            super().__setattr__(name, value)

        else:
            for element in self._elements:
                setattr(element, name, value)

    @property
    def classes(self):
        """Return the classes of the elements in the collection as a `ClassesCollection`."""
        return self._classes

    @property
    def elements(self):
        """Return the elements in the collection as a list."""
        return self._elements

    @property
    def style(self):
        """"""
        return self._style

    def find(self, selector):
        """Find all elements that match the specified selector.

        Return the results as a (possibly empty) `ElementCollection`.
        """
        elements = []
        for element in self._elements:
            elements.extend(element.find(selector))

        return ElementCollection(elements)


# Classes for every HTML element. If the element tag name (e.g. "input") clashes with
# either a Python keyword or common symbol, then we suffix the class name with an "_"
# (e.g. the class for the "input" element is "input_").


class a(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a"""


class abbr(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr"""


class address(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address"""


class area(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area"""


class article(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article"""


class aside(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside"""


class audio(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio"""


class b(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b"""


class base(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base"""


class blockquote(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote"""


class body(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body"""


class br(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br"""


class button(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button"""


class canvas(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas"""

    def download(self, filename: str = "snapped.png"):
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


class cite(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite"""


class code(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code"""


class col(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col"""


class colgroup(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup"""


class data(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data"""


class datalist(ContainerElement, HasOptions):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist"""


class dd(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd"""


class del_(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del"""


class details(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details"""


class dialog(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog"""


class div(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div"""


class dl(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl"""


class dt(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt"""


class em(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em"""


class embed(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed"""


class fieldset(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset"""


class figcaption(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption"""


class figure(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure"""


class footer(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer"""


class form(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form"""


class h1(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1"""


class h2(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2"""


class h3(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3"""


class h4(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4"""


class h5(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5"""


class h6(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6"""


class head(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head"""


class header(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header"""


class hgroup(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup"""


class hr(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr"""


class html(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html"""


class i(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i"""


class iframe(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe"""


class img(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img"""


class input_(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input"""


class ins(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins"""


class kbd(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd"""


class label(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label"""


class legend(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend"""


class li(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li"""


class link(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link"""


class main(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main"""


class map_(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map"""


class mark(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark"""


class menu(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu"""


class meta(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta"""


class meter(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter"""


class nav(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav"""


class object_(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object"""


class ol(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol"""


class optgroup(ContainerElement, HasOptions):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup"""


class option(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option"""


class output(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output"""


class p(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p"""


class param(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param"""


class picture(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture"""


class pre(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre"""


class progress(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress"""


class q(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q"""


class s(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s"""


class script(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script"""


class section(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section"""


class select(ContainerElement, HasOptions):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select"""


class small(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small"""


class source(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source"""


class span(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span"""


class strong(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong"""


class style(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style"""


class sub(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub"""


class summary(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary"""


class sup(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup"""


class table(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table"""


class tbody(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody"""


class td(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td"""


class template(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template"""


class textarea(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea"""


class tfoot(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot"""


class th(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th"""


class thead(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead"""


class time(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time"""


class title(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title"""


class tr(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr"""


class track(Element):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track"""


class u(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u"""


class ul(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul"""


class var(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var"""


class video(ContainerElement):
    """Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video"""

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


# fmt: off
ELEMENT_CLASSES = [
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


# Register all the default (aka "built-in") Element classes.
Element.register_element_classes(ELEMENT_CLASSES)


class Page:
    """Represents the whole page."""

    def __init__(self):
        self.html = Element.wrap_dom_element(document.documentElement)
        self.body = Element.wrap_dom_element(document.body)
        self.head = Element.wrap_dom_element(document.head)

    def __getitem__(self, selector):
        """Get an item on the page.

        We don't index/slice the page like we do with `Element` and `ElementCollection`
        as it is a bit muddier what the ideal behavior should be. Instead, we simply
        use this as a convenience method to `find` elements on the page.
        """
        return self.find(selector)

    @property
    def title(self):
        """Return the page title."""
        return document.title

    @title.setter
    def title(self, value):
        """Set the page title."""
        document.title = value

    def append(self, *items):
        """Shortcut for `page.body.append`."""
        self.body.append(*items)

    def find(self, selector):  # NOQA
        """Find all elements that match the specified selector.

        Return the results as a (possibly empty) `ElementCollection`.
        """
        return ElementCollection.wrap_dom_elements(document.querySelectorAll(selector))


page = Page()
